Base URL: http://localhost:5002 (adjust if different). Use the token from login in Authorization: Bearer <token>.

Auth

Register: curl -X POST http://localhost:5002/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"Passw0rd!","role":"user"}'
Login: curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Passw0rd!"}'
Me: curl -X GET http://localhost:5002/api/auth/me -H "Authorization: Bearer <token>"
Logout: curl -X GET http://localhost:5002/api/auth/logout -H "Authorization: Bearer <token>"
Update details: curl -X PUT http://localhost:5002/api/auth/updatedetails -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name":"New Name","phone":"1234567890"}'
Update password: curl -X PUT http://localhost:5002/api/auth/updatepassword -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"currentPassword":"Passw0rd!","newPassword":"NewPassw0rd!"}'
Events

List events (public): curl -X GET "http://localhost:5002/api/events?search=tech&category=all"
Get event: curl -X GET http://localhost:5002/api/events/<eventId>
Create event (admin): curl -X POST http://localhost:5002/api/events -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"Demo","description":"Test","location":"Hall A","dateTime":"2026-02-20T10:00:00.000Z","capacity":100,"category":"tech","visibility":"public","isPaid":false}'
Update event (admin): curl -X PUT http://localhost:5002/api/events/<eventId> -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"Updated Title"}'
Delete event (admin): curl -X DELETE http://localhost:5002/api/events/<eventId> -H "Authorization: Bearer <token>"
My organized events (admin): curl -X GET http://localhost:5002/api/events/my/organized -H "Authorization: Bearer <token>"
Organizer events: curl -X GET http://localhost:5002/api/events/organizer/<organizerId>
Event stats (admin): curl -X GET http://localhost:5002/api/events/<eventId>/stats -H "Authorization: Bearer <token>"
Registrations

Register for event: curl -X POST http://localhost:5002/api/registrations/<eventId> -H "Authorization: Bearer <token>"
My registrations: curl -X GET http://localhost:5002/api/registrations/my -H "Authorization: Bearer <token>"
Get registration: curl -X GET http://localhost:5002/api/registrations/<registrationId> -H "Authorization: Bearer <token>"
Cancel registration: curl -X DELETE http://localhost:5002/api/registrations/<registrationId> -H "Authorization: Bearer <token>"
Event registrations (admin): curl -X GET http://localhost:5002/api/registrations/event/<eventId> -H "Authorization: Bearer <token>"
Check-in attendee (admin): curl -X PUT http://localhost:5002/api/registrations/<registrationId>/checkin -H "Authorization: Bearer <token>"
Add to Google Calendar: curl -X POST http://localhost:5002/api/registrations/<registrationId>/add-to-calendar -H "Authorization: Bearer <token>"
If you want a Postman collection JSON, say the word and I’ll generate it.

