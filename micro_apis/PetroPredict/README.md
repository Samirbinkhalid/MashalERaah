# PetroPredict - Fuel Price Prediction

A Python application that uses Facebook Prophet to predict fuel prices based on historical data.

## Setup

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   python fuel_price_predictor.py
   ```

## Features

- Generates realistic dummy fuel price data from 2019 to 2025
- Uses Facebook Prophet to predict fuel prices for the next 5 months
- Saves predictions to CSV file
- Generates visualization plots

## Output

The application generates the following output files:
- `output/predictions.csv`: CSV file containing the predictions
- `output/prediction_plot.png`: Visualization of the historical data and predictions
- `output/component_plot.png`: Breakdown of the prediction components (trend, seasonality, etc.)
