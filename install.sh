#!/bin/bash

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "✅ All dependencies installed successfully!"
echo ""
echo "To start the development servers:"
echo "  Backend:  npm run dev:backend"
echo "  Frontend: npm run dev:frontend"
