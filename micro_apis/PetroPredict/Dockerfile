# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the content of the local src directory to the working directory
COPY . .

# Make port 8899 available to the world outside this container
EXPOSE 8899

# Run fuel_price_predictor.py when the container launches
CMD ["python", "fuel_price_predictor.py"]
