package com.foodDelivery.delivery_service.service;


import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverMatchingService {
    private final RedisTemplate<String , String>  redisTemplate;
    private final DriverRepo driverRepo;

    private static final String DRIVER_LOCATIONS_KEY = "driver-locations";

    @Value("${delivery.matching.radius-km:5.0}")
    private double matchingRadiusKm;

    @Value("${delivery.matching.max-drivers:10}")
    private int maxDrivers;

    @Value("${delivery.matching.retry-radius-km:10.0}")
    private double retryRadiusKm;

    //update driver location in redisGeo

    public void  updateDriverLocation(String driverId , double latitude , double longitude ){
        redisTemplate.opsForGeo().add(
                DRIVER_LOCATIONS_KEY,
                new Point(longitude,latitude),
                driverId
        );
        log.debug("Updated driver location: driverId={}, lat={}, lng={}", driverId, latitude, longitude);

    }

    //remove driver location from redis geo (while going offline )

    public  void  removeDriverLocation(String driverId ){
        redisTemplate.opsForGeo().remove(DRIVER_LOCATIONS_KEY, driverId);
        log.info("Removed driver location: driverId={}", driverId);
    }
//matching
//    Algorithm:
//            * 1. Query Redis GEO for all drivers within radius of restaurant
//     * 2. Sort by distance ascending
//     * 3. Filter: must be ONLINE status (not already on delivery)
//     * 4. Return first match
//     * 5. If no match, retry with wider radius

    public Optional<Driver> findNearestDriver(double restaurantLat , double restaurantLng ){
        //first search within configured radius
        Optional<Driver> driver = searchInRadius(restaurantLat , restaurantLng , matchingRadiusKm);

        if (driver.isPresent()){
            return driver;
        }

        //second attempt widerRadius
        log.info("No driver found within {}km, retrying with {}km radius", matchingRadiusKm, retryRadiusKm);
        return  searchInRadius(restaurantLat,restaurantLat,matchingRadiusKm);

    }

    private Optional<Driver>searchInRadius(double lat , double lng , double radiusKm ){
        try{

            GeoResults<RedisGeoCommands.GeoLocation<String>> nearBy=
                    redisTemplate.opsForGeo().radius(
                            DRIVER_LOCATIONS_KEY,
                            new Circle(
                                    new Point(lat,lng),
                                    new Distance(retryRadiusKm,Metrics.KILOMETERS)
                            ),
                            RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                                    .sortAscending()
                                    .limit(maxDrivers)
                    );
            if (nearBy ==null || nearBy.getContent().isEmpty()){
                log.info("No drivers found within {}km of ({}, {})", radiusKm, lat, lng);
                return Optional.empty();

            }

            //Fiilter : must








        }
        catch (Exception ex ){
            log.error("Redis GEO query failed, falling back to DB query: {}", e.getMessage());
            return fallbackToDatabase();

        }
    }




}
