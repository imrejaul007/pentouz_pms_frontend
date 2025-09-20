// Temporary utility to set authentication token for testing
// In a real app, this would be handled by the login component

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWQxYTNhMjQyNzJjNzM5MjA0N2RhMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NjE3NTUyMSwiZXhwIjoxNzU2NzgwMzIxfQ.ocD6eRrfIXaxsFTgqgu2lEKF8RoG_AdGJ_I274nqyLE";

// Set the token in localStorage
localStorage.setItem('token', token);

console.log('Authentication token set for admin user');
console.log('You can now access the admin dashboard at /admin');
console.log('Token will be valid for 7 days');

export { token };