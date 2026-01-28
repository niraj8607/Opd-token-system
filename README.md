🏥 OPD Token Allocation System
A dynamic, priority-driven OPD token management system designed for hospitals to efficiently handle patient flow, emergencies, and real-time slot reallocation.

This system supports elastic capacity management, multiple booking sources, and automatic reallocation to ensure optimal doctor utilization and reduced patient wait time.

🚀 Overview
The OPD Token Allocation System intelligently assigns and manages patient tokens across multiple doctors and time slots while handling real-world challenges such as:

Emergency cases

No-shows & cancellations

Slot overflows

Priority patients

Doctor unavailability

The system exposes RESTful APIs and is built to be scalable, fault-tolerant, and real-time ready.

✨ Key Features
🔹 Dynamic Token Allocation
Per-slot hard capacity limits

Emergency overflow support (controlled)

Real-time slot availability tracking

🔹 Multiple Token Sources
Online Booking

Walk-in Patients

Paid Priority Patients

Follow-up Patients

Emergency Cases

🔹 Priority-Based Scheduling
Patients are allocated tokens strictly based on medical and business priority.

🔹 Automatic Reallocation
Handles cancellations and no-shows

Promotes waiting patients automatically

Updates estimated consultation time

🔹 Robust Failure Handling
Graceful API error responses

Capacity validation

Duplicate token prevention

Invalid doctor / slot detection

🧠 Priority Logic
| Priority | Type           | Description                    |
| -------- | -------------- | ------------------------------ |
| 1️⃣      | Emergency      | Life-threatening conditions    |
| 2️⃣      | Paid Priority  | Patients who paid for priority |
| 3️⃣      | Follow-up      | Returning patients             |
| 4️⃣      | Online Booking | Pre-scheduled appointments     |
| 5️⃣      | Walk-in        | Direct OPD registration        |

Lower number = Higher Priority

🛠️ API Endpoints
| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| POST   | `/api/doctors`                    | Create new doctor   |
| GET    | `/api/doctors`                    | Fetch all doctors   |
| GET    | `/api/doctors/:doctorId/schedule` | Get doctor schedule |
| PUT    | `/api/doctors/:doctorId/slots`    | Update doctor slots |

🎟️ Tokens
| Method | Endpoint                           | Description         |
| ------ | ---------------------------------- | ------------------- |
| POST   | `/api/tokens`                      | Create new token    |
| POST   | `/api/tokens/emergency`            | Add emergency token |
| PUT    | `/api/tokens/:tokenId/cancel`      | Cancel token        |
| PUT    | `/api/tokens/:tokenId/no-show`     | Mark no-show        |
| GET    | `/api/tokens/doctor/:doctorId`     | Tokens by doctor    |
| POST   | `/api/tokens/reallocate/:doctorId` | Reallocate tokens   |

⚠️ Edge Cases Handled
Emergency insertion into full slots

Reserved emergency capacity per slot

Cancellation chain reaction

No-show auto-reallocation

Doctor unavailability with alternative suggestions

Slot overbooking prevention

❌ Failure Handling
Database connection issues

Invalid time slots

Duplicate token creation

Slot capacity exceeded

Invalid doctor or token IDs

Network timeouts

All failures return meaningful HTTP status codes and messages.

🗄️ Data Schema
Doctor
| Field Name            | Data Type     | Description                                |
| --------------------- | ------------- | ------------------------------------------ |
| name                  | String        | Doctor ka naam                             |
| specialization        | String        | Doctor ki specialization (e.g. Cardiology) |
| timeSlots             | Array         | Doctor ke available time slots             |
| timeSlots.startTime   | String        | Slot start time                            |
| timeSlots.endTime     | String        | Slot end time                              |
| timeSlots.maxCapacity | Number        | Maximum patients per slot                  |
| workingDays           | Array[String] | Doctor ke working days                     |

Token
| Field Name         | Data Type       | Description                                             |
| ------------------ | --------------- | ------------------------------------------------------- |
| tokenNumber        | String (Unique) | Generated token number                                  |
| patientName        | String          | Patient ka naam                                         |
| patientAge         | Number          | Patient ki age                                          |
| doctorId           | ObjectId        | Assigned doctor ka ID                                   |
| timeSlot           | Object          | Assigned time slot                                      |
| timeSlot.startTime | String          | Appointment start time                                  |
| timeSlot.endTime   | String          | Appointment end time                                    |
| source             | Enum            | `online / walkin / priority / followup / emergency`     |
| priority           | Number          | Patient priority (lower = higher priority)              |
| status             | Enum            | `pending / confirmed / completed / cancelled / no_show` |
| isEmergency        | Boolean         | Emergency patient flag                                  |

Timeslot
| Field Name             | Data Type | Description                                |
| ---------------------- | --------- | ------------------------------------------ |
| doctorId               | ObjectId  | Doctor reference                           |
| date                   | Date      | Slot date                                  |
| startTime              | String    | Slot start time                            |
| endTime                | String    | Slot end time                              |
| maxCapacity            | Number    | Slot ka maximum capacity                   |
| currentCount           | Number    | Current allocated tokens                   |
| reservedEmergencySlots | Number    | Emergency ke liye reserved slots           |
| status                 | Enum      | `available / full / completed / cancelled` |


🧮 Allocation Algorithm
Validate doctor availability

Validate time slot

Check capacity & reserved emergency slots

Apply priority rules

Assign token & estimate consultation time

Update slot counters

🔄 Reallocation Logic
Triggered on:

Cancellation

No-show

Process:

Free slot capacity

Check waiting list

Promote highest priority patient

Update estimated times

Notify next patient

🚑 Emergency Handling
Uses reserved emergency slots first

Allows controlled overflow (+1)

Assigns highest priority

Suggests alternative doctors if fully occupied

🧪 Simulation
Simulation demonstrates:

3 doctors with different specializations

15 regular patients

1 emergency patient

Cancellations and no-shows

Automatic reallocation in action

⚙️ Installation & Setup
1️⃣ Clone Repository
git clone <repository-url>
cd opd-token-system
2️⃣ Install Dependencies
npm install
3️⃣ Start MongoDB
mongod
4️⃣ Start Server
npm run dev
5️⃣ Run Simulation
npm run simulate
