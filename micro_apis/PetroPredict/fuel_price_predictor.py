import os
import json

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from prophet import Prophet


def generate_dummy_data():
    """Generate dummy fuel price data from 2019 to May 2025."""
    # Create date range from Jan 2019 to May 2025 (first of each month)
    start_date = '2019-01-01'
    end_date = '2025-05-01'
    
    # Generate dates for the first of each month
    dates = pd.date_range(start=start_date, end=end_date, freq='MS')
    
    # Calculate prices with some randomness (linear trend from 120 to 240)
    num_months = len(dates)
    base_prices = np.linspace(120, 240, num_months)
    
    # Add some noise to make it realistic
    np.random.seed(42)  # For reproducibility
    noise = np.random.normal(0, 5, num_months)
    prices = base_prices + noise
    
    # Create DataFrame
    df = pd.DataFrame({
        'ds': dates,
        'y': prices
    })
    
    # Ensure directory exists
    os.makedirs('data', exist_ok=True)
    
    # Save to CSV
    csv_path = 'data/fuel_prices.csv'
    df.to_csv(csv_path, index=False)
    print(f"Dummy data saved to {csv_path}")
    return df

def train_prophet_model(df):
    """Train Prophet model with the provided data."""
    # Initialize model
    model = Prophet(yearly_seasonality=True, 
                    weekly_seasonality=False, 
                    daily_seasonality=False,
                    seasonality_mode='multiplicative')
    
    # Fit model
    model.fit(df)
    
    return model

def make_predictions(model, periods=5):
    """Make predictions for future periods."""
    # Create future dataframe for predictions
    future = model.make_future_dataframe(periods=periods, freq='MS')
    
    # Make predictions
    forecast = model.predict(future)
    
    return forecast

def save_results(df, forecast, model):
    """Save prediction results and visualizations."""
    # Ensure output directory exists
    os.makedirs('output', exist_ok=True)
    
    # Get only future predictions (not historical data)
    last_historical_date = df['ds'].max()
    future_forecast = forecast[forecast['ds'] > last_historical_date]
    
    # Save only future predictions to JSON with renamed columns
    forecast_path = 'output/predictions.json'
    
    # Use renamed columns in the output file
    json_forecast = future_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
    json_forecast = json_forecast.rename(columns={
        'ds': 'Date', 
        'yhat': 'Predicted Price (PKR)', 
        'yhat_lower': 'Lower Bound (PKR)', 
        'yhat_upper': 'Upper Bound (PKR)'
    })
    
    # Convert datetime to string for JSON serialization
    json_forecast['Date'] = json_forecast['Date'].dt.strftime('%Y-%m-%d')
    
    # Save to JSON file
    json_forecast.to_json(forecast_path, orient='records', date_format='iso')
    print(f"Future predictions saved to {forecast_path}")
    
    # Create and save visualization
    plt.figure(figsize=(12, 8))
    
    # Plot the actual data
    plt.plot(df['ds'], df['y'], 'ko', markersize=4, label='Historical Data')
    
    # Plot the predicted values
    plt.plot(forecast['ds'], forecast['yhat'], 'steelblue', linewidth=2, label='Forecast')
    
    # Plot the uncertainty intervals
    plt.fill_between(forecast['ds'], forecast['yhat_lower'], forecast['yhat_upper'], 
                     color='steelblue', alpha=0.2, label='Uncertainty Interval')
    
    # Highlight predictions for the next 5 months
    last_historical_date = df['ds'].max()
    future_data = forecast[forecast['ds'] > last_historical_date]
    plt.plot(future_data['ds'], future_data['yhat'], 'r-', linewidth=2.5, label='Next 5 Months')
    
    # Formatting
    plt.title('Fuel Price Forecast', fontsize=16)
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Price (PKR)', fontsize=12)
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Save figure
    plot_path = 'output/prediction_plot.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Plot saved to {plot_path}")
    
    # Save component plots
    fig = model.plot_components(forecast)
    component_path = 'output/component_plot.png'
    fig.savefig(component_path, dpi=300, bbox_inches='tight')
    print(f"Component plot saved to {component_path}")

def main(prediction_months=12):
    # Number of months to predict (can be modified externally)
    
    # Generate dummy data if it doesn't exist
    if not os.path.exists('data/fuel_prices.csv'):
        df = generate_dummy_data()
    else:
        # Read existing data
        df = pd.read_csv('data/fuel_prices.csv')
        df['ds'] = pd.to_datetime(df['ds'])
    
    # Train model
    model = train_prophet_model(df)
    
    # Make predictions for the specified number of months
    forecast = make_predictions(model, periods=prediction_months)
    
    # Save results
    save_results(df, forecast, model)
    
    # Show details about the predictions
    last_date = df['ds'].max()
    print(f"\nPredictions for the next {prediction_months} months:")
    future_preds = forecast[forecast['ds'] > last_date][['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    future_preds = future_preds.rename(columns={
        'ds': 'Date', 
        'yhat': 'Predicted Price (PKR)', 
        'yhat_lower': 'Lower Bound (PKR)', 
        'yhat_upper': 'Upper Bound (PKR)'
    })
    print(future_preds.to_string(index=False, float_format=lambda x: f"{x:.2f}"))
    
    # Return the content of predictions.json file as JSON response
    with open('output/predictions.json', 'r') as json_file:
        return json_file.read()

# CherryPy implementation
import cherrypy

class FuelPricePredictionService:
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def index(self, prediction_months=12):
        # Convert the parameter to integer
        prediction_months = int(prediction_months)
        
        # Call the main function with the parameter and return its result
        result = main(prediction_months)
        return json.loads(result)

if __name__ == "__main__":
    # Configure CherryPy server
    cherrypy.config.update({
        'server.socket_host': '0.0.0.0',
        'server.socket_port': 8899,
    })
    
    # No need for manual content type headers since json_out tool will set them
    
    # Start CherryPy server
    cherrypy.quickstart(FuelPricePredictionService())
