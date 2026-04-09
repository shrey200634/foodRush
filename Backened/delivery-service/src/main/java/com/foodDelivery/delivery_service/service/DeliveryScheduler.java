package com.foodDelivery.delivery_service.service;

import com.foodDelivery.delivery_service.domain.Delivery;
import com.foodDelivery.delivery_service.domain.DeliveryStatus;
import com.foodDelivery.delivery_service.repository.DeliveryRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DeliveryScheduler {
    private  final DeliveryService deliveryService;
    private  final DeliveryRepo deliveryRepo;

    @Value("${delivery.auto-reassign.pickup-timeout-minutes:15}")
    private int pickupTimeoutMinutes;

    //every 30 Sec ...retry matching driver for pending deliveries
    @Scheduled(fixedRate = 30000)
    public  void  retryPendingDeliveries(){
        deliveryService.retryPendingDeliveries();
    }
    // Every 60 sec: check for drivers who haven't picked up within timeout
    @Scheduled(fixedRate = 60000)
    public void checkPickupTimeouts(){
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pickupTimeoutMinutes);

        List<Delivery> timedOut = deliveryRepo.findAll().stream()
                .filter(d -> d.getStatus() == DeliveryStatus.DRIVER_ASSIGNED)
                .filter(d -> d.getAssignedAt() != null)
                .filter(d -> d.getAssignedAt().isBefore(cutoff))
                .toList();

        for (Delivery delivery : timedOut) {
            log.warn("Driver {} hasn't picked up order {} within {} minutes — reassigning",
                    delivery.getDriverId(), delivery.getOrderId(), pickupTimeoutMinutes);
            delivery.setStatus(DeliveryStatus.PENDING);
            delivery.setDriverId(null);
            delivery.setAssignedAt(null);
            deliveryRepo.save(delivery);

            // Will be picked up by retryPendingDeliveries on next cycle
        }
    }

}
