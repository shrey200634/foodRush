package com.foodDelivery.delivery_service.service;

import com.foodDelivery.delivery_service.domain.Delivery;
import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.domain.DriverStatus;
import com.foodDelivery.delivery_service.dto.DeliveryResponse;
import com.foodDelivery.delivery_service.dto.DriverRegistrationRequest;
import com.foodDelivery.delivery_service.dto.DriverResponse;
import com.foodDelivery.delivery_service.kafka.DeliveryEventProducer;
import com.foodDelivery.delivery_service.repository.DeliveryRepo;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeliveryService {
    private final DeliveryRepo deliveryRepo;
    private   final DriverRepo driverRepo;
    private  final DriverMatchingService driverMatchingService;
    private final ETAService etaService;
    private final DeliveryEventProducer deliveryEventProducer;
    /// ////------------Driver ManageMent --------------------------------------------//

    //---------------- Register for the driver profile ------------//


    @Transactional
    public DriverResponse registerDriver(String userId , DriverRegistrationRequest request){
        if (driverRepo.existsByUserId(userId)){
            throw  new IllegalStateException("Driver profile already exists for this user ");
        }
        Driver driver = Driver.builder()
                .driverId(UUID.randomUUID().toString())
                .userId(userId)
                .name(request.getName())
                .phone(request.getPhone())
                .vehicleType(request.getVehicleType())
                .vehicleNumber(request.getVehicleNum())
                .status(DriverStatus.OFFLINE)
                .avgRating(BigDecimal.ZERO)
                .totalDeliveries(0)
                .build();

        driver=driverRepo.save(driver);
        log.info("Driver registered: driverId={}, name={}", driver.getDriverId(), driver.getName());
        return toDriverResponse(driver);


    }


    // Driver goes Online - available for deliveries
    //required current location to add to redis Geo

//    @Transactional
//    public  DriverResponse goOnline(String userId , double lat , double lng){
//        Driver driver=driverRepo.findByUserId(userId)
//                .or
//    }

    //--------Mappers ---------------//

    private DriverResponse toDriverResponse(Driver driver){
        return DriverResponse.builder()
                .driverId(driver.getDriverId())
                .userId(driver.getUserId())
                .name(driver.getName())
                .phone(driver.getPhone())
                .vehicleType(driver.getVehicleType())
                .vehicleNumber(driver.getVehicleNumber())
                .status(driver.getStatus().name())
                .currentLatitude(driver.getCurrentLatitude())
                .currentLongitude(driver.getCurrentLongitude())
                .avgRating(driver.getAvgRating())
                .totalDeliveries(driver.getTotalDeliveries())
                .build();
    }

    private DeliveryResponse toDeliveryResponse(Delivery delivery) {
        DeliveryResponse.DeliveryResponseBuilder builder = DeliveryResponse.builder()
                .deliveryId(delivery.getDeliveryId())
                .orderId(delivery.getOrderId())
                .userId(delivery.getUserId())
                .restaurantId(delivery.getRestaurantId())
                .restaurantName(delivery.getRestaurantName())
                .driverId(delivery.getDriverId())
                .status(delivery.getStatus().name())
                .pickupAddress(delivery.getPickupAddress())
                .dropoffAddress(delivery.getDropoffAddress())
                .estimatedDeliveryMins(delivery.getEstimatedDeliveryMins())
                .actualDeliveryMins(delivery.getActualDeliveryMins())
                .distanceKm(delivery.getDistanceKm())
                .assignedAt(delivery.getAssignedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .createdAt(delivery.getCreatedAt());

        // Add driver info if assigned
        if (delivery.getDriverId() != null) {
            driverRepo.findById(delivery.getDriverId()).ifPresent(driver -> {
                builder.driverName(driver.getName());
                builder.driverPhone(driver.getPhone());
                builder.driverLatitude(driver.getCurrentLatitude());
                builder.driverLongitude(driver.getCurrentLongitude());
            });
        }

        return builder.build();
    }

}
