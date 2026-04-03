package com.foodDelivery.order_service.service;

import com.foodDelivery.order_service.domain.Order;
import com.foodDelivery.order_service.domain.OrderItem;
import com.foodDelivery.order_service.dto.CartResponse;
import com.foodDelivery.order_service.dto.OrderPlacedEvent;
import com.foodDelivery.order_service.dto.OrderResponse;
import com.foodDelivery.order_service.dto.PlaceOrderRequest;
import com.foodDelivery.order_service.kafka.OrderEventProducer;
import com.foodDelivery.order_service.repository.OrderRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
   private final OrderRepo orderRepo;
   private final CartService cartService;
   private  final OrderEventProducer orderEventProducer;

   // place and order

    @Transactional
    public OrderResponse placeOrder(String userId , PlaceOrderRequest request){

        // get current cart
        CartResponse cart = cartService.getCart(userId);
        if (cart.getItem()==null || cart.getItem().isEmpty()){
            throw new RuntimeException("Cart is empty. Add items before placing an order.");
        }

        // create order entity
        Order order = Order.builder()
                .userId(userId)
                .restaurantId(cart.getRestaurantId())
                .restaurantName(cart.getRestaurantName())
                .deliveryAddressId(request.getDeliveryAddressId())
                .deliverAddress(request.getDeliverAddress())
                .subTotal(cart.getSubTotal())
                .deliveryFee(cart.getDeliveryFee())
                .totalAmount(cart.getTotal())
                .specialInstructions(request.getSpecialInstructions())
                .estimatedDeliveryMins(30)
                .build();
        // convert cart item to order item
        List<OrderItem>   orderItems = cart.getItem().stream()
                .map(cartItem -> OrderItem.builder()
                        .order(order)
                        .menuItemId(cartItem.getMenuItemId())
                        .menuItemName(cartItem.getMenuItemName())
                        .quantity(cartItem.getQuantity())
                        .unitPrice(cartItem.getUnitPrice())
                        .totalPrice(cartItem.getTotalPrice())
                        .addedByUserId(userId)
                        .build()
                ).toList();

        order.setItems(orderItems);

        //save to mysql
        Order savedOrder = orderRepo.save(order);
        log.info("Order placed: orderId={}, userId={}, restaurant={}, total={}",
                savedOrder.getOrderId(), userId, cart.getRestaurantName(), cart.getTotal());

        //produce to kafka
        try {
           orderEventProducer.sendOrderPlaced(OrderPlacedEvent.builder()
                           .orderId(savedOrder.getOrderId())
                           .userId(userId)
                           .restaurantId(cart.getRestaurantId())
                           .restaurantName(cart.getRestaurantName())
                           .totalAmount(cart.getTotal())
                           .deliveryAddress(request.getDeliverAddress())
                           .specialInstructions(request.getSpecialInstructions())
                           .placedAt(savedOrder.getCreatedAt())
                           .build());


        } catch (Exception ex ){
            log.warn("Failed to publish order-placed event (Kafka may not be running): {}", ex.getMessage());
        }

        //clear the cart
        cartService.clearCart(userId);

        return OrderResponse.fromEntity(savedOrder);

    }

}
