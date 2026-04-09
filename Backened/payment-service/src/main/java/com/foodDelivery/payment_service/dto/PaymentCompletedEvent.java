package com.foodDelivery.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class PaymentCompletedEvent {
    private String orderID ;
    private String userId ;
    private String restaurantId ;
    private BigDecimal totalAmount ;
    private BigDecimal platformFee;
    private  BigDecimal restaurantPayload ;
    private LocalDateTime settledAt;

}
