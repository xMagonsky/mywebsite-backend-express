## Description
It is an API server built with Node.js and Express.js, providing backend functionalities for my web application.

## Technologies
- Node.js
- Express.js
- MySQL
- Redis

## Configuration
This project uses environment variables stored in a `.env` file. Ensure you configure it properly based on `.env.example` before running the server.

## API Endpoints
List of available endpoints:
- `POST /api/login` - User login
- `GET /api/myloans` - Retrieves user's loans
- `GET /api/loans` - Retrieves all loans
- `POST /api/loans` - Creates a new loan
- `GET /api/loans/:id` - Retrieves a loan by ID
- `PATCH /api/loans/:id` - Updates a loan by ID
- `DELETE /api/loans/:id` - Deletes a loan by ID
