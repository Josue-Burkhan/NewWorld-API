# Overview

This project is a personal initiative to deepen my understanding of modern backend development by building a comprehensive, data-driven application from the ground up. The goal was to engineer a scalable and robust RESTful API capable of managing a complex, interconnected data model, suitable for a world-building or gaming application.

The software is a RESTful API built with Node.js and the Express framework. It serves as the backend for a "New World" creative application, allowing users to perform full CRUD (Create, Read, Update, Delete) operations on a wide variety of interconnected data models, such as Characters, Factions, Locations, and more. Key features include a secure authentication system using JSON Web Tokens (JWT) and auto-generated API documentation with Swagger to facilitate testing and integration.

My purpose for writing this software was to gain practical, hands-on experience with the entire lifecycle of backend development in a JavaScript environment. This included designing a RESTful architecture, modeling complex and relational data with Mongoose, securing endpoints with authentication middleware, handling asynchronous operations, and structuring a large codebase with a clear separation of concerns (models, views, controllers).

[Software Demo Video](https://youtu.be/Qds-u43hmI4)

# Development Environment

The API was developed using a modern JavaScript toolchain. The primary tools used were:

- **Code Editor:** Visual Studio Code
- **Runtime Environment:** Node.js
- **Database:** MongoDB, interacted with via the Mongoose ODM.
- **API Client:** Postman was used for testing the RESTful endpoints.
- **Version Control:** Git and GitHub

The primary programming language used is **JavaScript (ES6+)**. The application is built upon a foundation of powerful open-source libraries, including:

- **Express.js:** A minimal and flexible web application framework for Node.js that provides a robust set of features for web and mobile applications.
- **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js. It manages relationships between data, provides schema validation, and is used to translate between objects in code and their representation in MongoDB.
- **JSON Web Token (`jsonwebtoken`):** Used for creating access tokens that assert claims, enabling secure user authentication.
- **Passport.js:** A simple, unobtrusive authentication middleware for Node.js. It was used to implement token-based authentication strategies.
- **Swagger UI Express:** Used to automatically generate interactive API documentation from a Swagger/OpenAPI definition.
- **Dotenv:** A zero-dependency module that loads environment variables from a `.env` file into `process.env`.
- **CORS:** A Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.

# Useful Websites

- [MDN Web Docs](https://developer.mozilla.org/en-US/) - An invaluable resource for JavaScript syntax, web APIs, and other web development topics.
- [Node.js Documentation](https://nodejs.org/en/docs/) - The official documentation for the Node.js runtime environment.
- [Express.js Official Website](https://expressjs.com/) - The official site for the Express framework, with guides and API references.
- [Mongoose ODM Documentation](https://mongoosejs.com/docs/guide.html) - The official documentation for Mongoose, essential for understanding schemas, models, and queries.
- [Stack Overflow](https://stackoverflow.com/) - A critical resource for troubleshooting specific coding problems and learning from the community.

# Future Work

- **Implement Password Hashing:** Add `bcryptjs` or a similar library to hash user passwords before storing them in the database to significantly improve security.
- **Add True Recursive Functions:** Implement true recursive logic for operations like deep data population (getting a character and all their multi-level relationships) or cascade deletes to handle nested data more elegantly.
- **Create a Centralized Error Handler:** Refactor the error handling by creating a single, dedicated middleware to catch all errors. This will reduce code repetition in the routes and provide more consistent error responses.
- **Write Unit and Integration Tests:** Introduce a testing framework like Jest or Mocha to write automated tests for API endpoints, controllers, and utility functions, ensuring code reliability and preventing regressions.
- **Refactor Utility Functions:** Break down large utility functions like `autoPopulateRefs.js` into smaller, more specialized, and reusable functions to improve readability and maintainability.
