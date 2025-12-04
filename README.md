# To build the image:
    docker build -t eepz-frontend .

# To run the container:
    docker run -d -p 3007:3007 --name eepz-frontend-container eepz-frontend

# To remove the container (If required):
    docker rm -f eepz-frontend-container