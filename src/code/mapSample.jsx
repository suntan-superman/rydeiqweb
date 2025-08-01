/* eslint-disable */
import React, {
	useCallback,
	useRef,
	useEffect,
	useState,
	forwardRef,
	useMemo,
} from "react";
import {
	GoogleMap,
	useLoadScript,
	MarkerF,
	InfoWindow,
	InfoWindowF,
} from "@react-google-maps/api";
import { Box } from "@mui/material";
import useDeliveryStore from "../../stores/deliveryStore";
import SimulationSetupDialog from "../simulation/SimulationSetupDialog";
import SimulationControls from "../simulation/SimulationControls";
import { useMapAnimations } from '../../hooks/useMapAnimations';
import { calculateDistance } from '../../utils/mapUtils';
import PropTypes from 'prop-types';

// Define libraries as a static constant outside the component
const LIBRARIES = ['places'];

const mapContainerStyle = {
	width: "100%",
	height: "100%"
};

const defaultCenter = {
	lat: 35.3733,
	lng: -119.0187,
};

const defaultZoom = 13;

const defaultMapOptions = {
	disableDefaultUI: false,
	zoomControl: true,
	mapTypeControl: false,
	scaleControl: true,
	streetViewControl: false,
	rotateControl: false,
	fullscreenControl: true,
};

// Update the icon constants at the top
const ICON_PATHS = {
	vehicle: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", // Delivery truck
	destination: "M11.8 5c0-1.65 1.35-3 3-3s3 1.35 3 3h2c0-2.76-2.24-5-5-5s-5 2.24-5 5m5 1L6 21h12L7 6h9.8zM3 21h18v2H3v-2z", // Construction icon
	distributionCenter: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" // Warehouse
};

// Add this helper function at the top of the component
const getAnchorPoint = (isLoaded) => {
	if (!isLoaded || !window.google) {
		return { x: 12, y: 12 };
	}
	return new window.google.maps.Point(12, 12);
};

const DeliveryMap = forwardRef(({ 
	onStartSimulation,
	onPauseSimulation,
	onResetSimulation,
	onError
}, ref) => {
  const { isLoaded, loadError } = useLoadScript({
			googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
			libraries: LIBRARIES,
		});

	const mapRef = useRef(null);
	const [setupDialogOpen, setSetupDialogOpen] = useState(false);
	const [selectedVehicle, setSelectedVehicle] = useState(null);
	const [selectedDestination, setSelectedDestination] = useState(null);
	const [showOriginInfo, setShowOriginInfo] = useState(false);

  const {
			vehicles,
			destinations,
			distributionCenters,
			isSimulationRunning,
			updateVehiclePosition,
		} = useDeliveryStore();

	// Add animation hook
	const { startAnimation, cancelAllAnimations } = useMapAnimations();

	// Add animation cleanup effect
	useEffect(() => {
		return () => {
			cancelAllAnimations();
		};
	}, [cancelAllAnimations]);

	// Debug logs
	useEffect(() => {
		console.log('DeliveryMap - Store Data:', {
			vehicles: vehicles?.length,
			vehicleData: vehicles,
			destinations: destinations?.length,
			destinationData: destinations,
			distributionCenters: distributionCenters?.length,
			distributionCenterData: distributionCenters,
			isLoaded,
			loadError
		});
	}, [vehicles, destinations, distributionCenters, isLoaded, loadError]);

	// Debug logs for markers
		useEffect(() => {
			if (isLoaded && window.google) {
				console.log("Map is loaded with data:", {
					distributionCentersCount: distributionCenters?.length,
					vehiclesCount: vehicles?.length,
					google: Boolean(window.google),
				});
			}
		}, [isLoaded, distributionCenters, vehicles]);

	// Add debug logs for origin and destination data
		useEffect(() => {
			if (isLoaded && window.google) {
				console.log("Distribution Center Data:", {
					distributionCenters: distributionCenters?.map((d) => ({
						id: d.id,
						coordinates: d.coordinates,
					})),
				});
			}
		}, [isLoaded, distributionCenters]);

	// Add this debug effect
	useEffect(() => {
		console.log('Destination Data Check:', {
			hasDestinations: Boolean(destinations?.length),
			destinationCount: destinations?.length,
			destinations: destinations?.map(d => ({
				id: d.id,
				name: d.name,
				coordinates: d.coordinates,
				hasValidCoords: Boolean(d.coordinates?.lat && d.coordinates?.lng)
			}))
		});
	}, [destinations]);

	const handleMapLoad = useCallback((map) => {
		console.log('Map load called with:', { 
			map, 
			isLoaded: Boolean(isLoaded), 
			google: Boolean(window.google),
			destinationsCount: destinations?.length,
			destinationCoords: destinations?.map(d => ({
				id: d.id,
				lat: d.coordinates?.lat,
				lng: d.coordinates?.lng
			}))
		});

		if (!map || !isLoaded || !window.google) return;

		mapRef.current = map;
		if (ref) {
			ref.current = map;
		}

		// Fit bounds to include all markers
		const bounds = new window.google.maps.LatLngBounds();
		
		for (const dest of destinations ?? []) {
			if (dest?.coordinates) {
				const pos = {
					lat: Number.parseFloat(dest.coordinates.lat),
					lng: Number.parseFloat(dest.coordinates.lng)
				};
				console.log('Adding to bounds:', pos);
				bounds.extend(pos);
			}
		}

		for (const dc of distributionCenters ?? []) {
			if (dc?.coordinates) {
				const pos = {
					lat: Number.parseFloat(dc.coordinates.lat),
					lng: Number.parseFloat(dc.coordinates.lng)
				};
				console.log('Adding distribution center to bounds:', pos);
				bounds.extend(pos);
			}
		}

		map.fitBounds(bounds);
		
		// Force a re-render of the map
		setTimeout(() => {
			map.setZoom(map.getZoom());
		}, 100);
	}, [destinations, distributionCenters, ref, isLoaded]);

	// Add this effect after handleMapLoad
	useEffect(() => {
		if (!mapRef.current || !isLoaded || !window.google) return;

		const bounds = new window.google.maps.LatLngBounds();
		let hasValidBounds = false;

		for (const dest of destinations ?? []) {
			if (dest?.coordinates) {
				const pos = {
					lat: Number.parseFloat(dest.coordinates.lat),
					lng: Number.parseFloat(dest.coordinates.lng)
				};
				bounds.extend(pos);
				hasValidBounds = true;
				console.log('Added destination to bounds:', pos);
			}
		}

		for (const dc of distributionCenters ?? []) {
			if (dc?.coordinates) {
				const pos = {
					lat: Number.parseFloat(dc.coordinates.lat),
					lng: Number.parseFloat(dc.coordinates.lng)
				};
				bounds.extend(pos);
				hasValidBounds = true;
				console.log('Added distribution center to bounds:', pos);
			}
		}

		if (hasValidBounds) {
			console.log('Fitting map to bounds');
			mapRef.current.fitBounds(bounds);
		}
	}, [destinations, distributionCenters, isLoaded]);

	// Remove the isGoogleMapsLoaded function and update renderDistributionCenters
	const renderDistributionCenters = useCallback(() => {
		if (!isLoaded || !distributionCenters?.length) {
			console.log('Skipping DC render:', { 
				isLoaded, 
				hasDCs: Boolean(distributionCenters?.length)
			});
			return null;
		}

		return distributionCenters.map(dc => {
			if (!dc?.coordinates) {
				console.log('Invalid DC:', dc);
				return null;
			}
			
			const position = {
				lat: Number(dc.coordinates.lat),
				lng: Number(dc.coordinates.lng)
			};

			return (
				<MarkerF
					key={dc.id}
					position={position}
					icon={{
						path: ICON_PATHS.distributionCenter,
						fillColor: '#1976d2',
						fillOpacity: 1,
						strokeWeight: 1,
						strokeColor: '#000000',
						scale: 1.5,
						anchor: getAnchorPoint(isLoaded)
					}}
					onClick={() => handleDCClick(dc)}
				/>
			);
		}).filter(Boolean);
	}, [isLoaded, distributionCenters]);

	// Update handleSimulationStart
	const handleSimulationStart = useCallback(async (assignments) => {
		try {
			console.log("DeliveryMap: handleSimulationStart called");

			// Set simulation running state before starting animations
			useDeliveryStore.getState().setSimulationRunning(true);

			// Update vehicle statuses and destinations
			const updatedVehicles = vehicles.map((vehicle) => {
				const destinationId = assignments[vehicle.id];
				if (destinationId) {
					return {
						...vehicle,
						status: "delivering",
						destinationId,
					};
				}
				return vehicle;
			});

			// Update vehicles in store
			useDeliveryStore.getState().setVehicles(updatedVehicles);

			// Start animations
			for (const [vehicleId, destinationId] of Object.entries(assignments)) {
				const vehicle = updatedVehicles.find((v) => v.id === vehicleId);
				const destination = destinations.find((d) => d.id === destinationId);

				if (vehicle && destination) {
					startAnimation(
						vehicleId,
						vehicle.location,
						destination.coordinates,
						calculateDistance(vehicle.location, destination.coordinates) * 1000,
						(position) => updateVehiclePosition(vehicleId, position),
					);
				}
			}

			if (onStartSimulation) {
				await onStartSimulation(assignments);
			}
		} catch (error) {
			console.error("Error starting simulation:", error);
			useDeliveryStore.getState().setSimulationRunning(false);
			if (onError) {
				onError("Failed to start simulation");
			}
		}
	}, [vehicles, destinations, startAnimation, onStartSimulation, onError, updateVehiclePosition]);

	// Update the vehicleMarkers to be more responsive to position changes
	const vehicleMarkers = useMemo(() => {
		return vehicles.map((vehicle) => {
			if (!vehicle?.location?.lat || !vehicle?.location?.lng) return null;
			
			// Updated color logic
			const hasDestination = Boolean(vehicle.destinationId);
			const isDelivering = vehicle.status === 'delivering';
			let fillColor;
			
			if (isDelivering) {
				fillColor = '#4CAF50'; // Green for actively delivering
			} else if (hasDestination) {
				fillColor = '#2196F3'; // Blue for assigned but not active
			} else {
				fillColor = '#FFA000'; // Yellow/Orange for unassigned
			}
			
			return (
				<MarkerF
					key={vehicle.id}
					position={{
						lat: Number(vehicle.location.lat),
						lng: Number(vehicle.location.lng),
					}}
					icon={{
						path: ICON_PATHS.vehicle,
						fillColor,
						fillOpacity: 1,
						strokeWeight: 1,
						strokeColor: "#000000",
						scale: 1.5,
						rotation: 0,
						anchor: getAnchorPoint(isLoaded),
					}}
					onClick={() => setSelectedVehicle(vehicle)}
				/>
			);
		}).filter(Boolean);
	}, [isLoaded, vehicles]);

	// Add this useEffect to log simulation state changes
	useEffect(() => {
		console.log('DeliveryMap: Simulation state updated:', {
			isRunning: isSimulationRunning,
			hasActiveVehicles: vehicles.some(v => v.status === 'active' || v.status === 'delivering')
		});
	}, [isSimulationRunning, vehicles]);

  if (loadError) {
			return <div>Error loading maps</div>;
		}

  return (
			<Box sx={{ width: "100%", height: "100%", position: "relative" }}>
				{loadError && <div>Error loading maps</div>}

				{!isLoaded ? (
					<div>Loading map...</div>
				) : (
					<GoogleMap
						mapContainerStyle={mapContainerStyle}
						center={defaultCenter}
						zoom={defaultZoom}
						onLoad={handleMapLoad}
						options={defaultMapOptions}
					>
						{isLoaded && (
							<>
								{renderDistributionCenters()}
								{/* Destination Markers */}
								{destinations?.map((destination) => (
									<MarkerF
										key={destination.id}
										position={destination.coordinates}
										onClick={() => setSelectedDestination(destination)}
										icon={{
											path: ICON_PATHS.destination,
											fillColor: "#f44336",
											fillOpacity: 1,
											strokeWeight: 1,
											strokeColor: "#000000",
											scale: 1.5,
											anchor: new window.google.maps.Point(12, 12),
										}}
									>
										{selectedDestination?.id === destination.id && (
											<InfoWindowF
												position={destination.coordinates}
												onCloseClick={() => setSelectedDestination(null)}
											>
												<div>
													<h3>{destination.name}</h3>
													<p>
														Location: {destination.coordinates.lat.toFixed(4)},{" "}
														{destination.coordinates.lng.toFixed(4)}
													</p>
												</div>
											</InfoWindowF>
										)}
									</MarkerF>
								))}

								{/* Vehicle Markers */}
								{vehicleMarkers}

								{showOriginInfo && (
									<InfoWindow
										position={defaultCenter}
										onCloseClick={() => setShowOriginInfo(false)}
									>
										<div>
											<h3>Distribution Center</h3>
											<p>
												Location: {defaultCenter.lat.toFixed(4)},{" "}
												{defaultCenter.lng.toFixed(4)}
											</p>
											<p>
												Active Vehicles:{" "}
												{vehicles?.filter((v) => v.status === "active")
													.length || 0}
											</p>
											<p>Total Vehicles: {vehicles?.length || 0}</p>
										</div>
									</InfoWindow>
								)}

								{selectedVehicle && (
									<InfoWindow
										position={{
											lat: Number(selectedVehicle.location.lat),
											lng: Number(selectedVehicle.location.lng),
										}}
										onCloseClick={() => setSelectedVehicle(null)}
									>
										<div>
											<h3>Vehicle {selectedVehicle.id}</h3>
											<p>Status: {selectedVehicle.status}</p>
											{selectedVehicle.metrics && (
												<>
													<p>Progress: {selectedVehicle.metrics.progress}%</p>
													<p>
														Speed:{" "}
														{Math.round(selectedVehicle.metrics.currentSpeed)}{" "}
														mph
													</p>
												</>
											)}
										</div>
									</InfoWindow>
								)}
							</>
						)}
					</GoogleMap>
				)}

				<SimulationSetupDialog
					open={setupDialogOpen}
					onClose={() => setSetupDialogOpen(false)}
					onStart={handleSimulationStart}
				/>

				<SimulationControls
					onStart={() => {
						console.log("Opening setup dialog");
						setSetupDialogOpen(true);
					}}
					onPause={() => {
						console.log("Pausing simulation");
						useDeliveryStore.getState().setSimulationRunning(false);
						cancelAllAnimations();
						onPauseSimulation?.();
					}}
					onReset={() => {
						console.log("Resetting simulation");
						useDeliveryStore.getState().resetSimulation();
						cancelAllAnimations();
						onResetSimulation?.();
						setSelectedVehicle(null);
					}}
					onError={onError}
				/>
			</Box>
		);
});

DeliveryMap.displayName = "DeliveryMap";

DeliveryMap.propTypes = {
	onStartSimulation: PropTypes.func,
	onPauseSimulation: PropTypes.func,
	onResetSimulation: PropTypes.func,
	onError: PropTypes.func,
};

DeliveryMap.defaultProps = {
	onStartSimulation: () => {},
	onPauseSimulation: () => {},
	onResetSimulation: () => {},
	onError: () => {},
};

export default DeliveryMap; 