# Vehicle Images

This directory contains generic vehicle images used as fallbacks when driver-uploaded photos are not available.

## Image Files

### Required Images:
- `generic-sedan.png` - Generic sedan image
- `generic-suv.png` - Generic SUV image  
- `generic-truck.png` - Generic pickup truck image
- `generic-van.png` - Generic van image
- `generic-luxury.png` - Generic luxury vehicle image
- `generic-car.png` - Default/standard car image
- `generic-accessible-van.png` - Wheelchair accessible van image
- `generic-medical-van.png` - Medical transportation van image
- `default-vehicle-icon.png` - Ultimate fallback icon

## Specifications:
- **Format**: PNG with transparency
- **Dimensions**: 800x600px (4:3 aspect ratio)
- **View**: 3/4 front view preferred
- **Background**: Transparent or white
- **Style**: Clean, professional, side-view silhouette

## Sources:
You can obtain these images from:
1. **Free Stock Images**: Pexels, Unsplash, Pixabay
2. **Vector Graphics**: Flaticon, The Noun Project
3. **Car APIs**: Imagin Studio, Marketcheck Auto API
4. **Custom Creation**: Create simple silhouettes in design tools

## Usage:
These images are automatically loaded by the `vehicleImageService` when:
1. Driver hasn't uploaded a vehicle photo
2. External API fallback fails
3. Vehicle type is specified but no photo available

## Installation:
Replace the placeholder images with actual vehicle images matching the specifications above.

