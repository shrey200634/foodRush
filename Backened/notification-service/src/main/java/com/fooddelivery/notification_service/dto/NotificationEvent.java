package com.fooddelivery.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NotificationEvent {
    private String orderId;
    private String userEmail;
    private String userName;
    private String restaurantName;
    private Double totalAmount;
    private String status;
}
