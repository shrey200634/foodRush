package com.foodDelivery.delivery_service.service;


import com.foodDelivery.delivery_service.repository.DeliveryRepo;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class TrackingService {

    private  final SimpMessagingTemplate messagingTemplate;
    private final DeliveryRepo deliveryRepo;
    private final DriverRepo driverRepo;
    private final ETAService etaService;
}
