# Test User Note

## ⚠️ IMPORTANT: TEMPORARY TEST USER

**User ID:** `lhoijzfg2ya5Z7LzY2RBiWBI3sa2`
**Email:** `gm@eimutah.com`

This is a temporary test user that has been added to the seed data for testing purposes.

### Modified Files:
1. **usersSeed.json** - Changed USR-0001 to use the test user ID
2. **ordersSeed.json** - Updated orders ORD-2025-1001, ORD-2025-1002, ORD-2025-1003, and ORD-2025-1010 to link to the test user

### Addresses Seeded for Test User:
- Default shipping address: 123 Maple St, Provo, UT 84601
- Billing address: 456 Oak Ave, Provo, UT 84602

### Orders Linked to Test User:
- ORD-2025-1001 (paid) - KB-KCR-K2V3, AC-LOGI-MX3S
- ORD-2025-1002 (shipped) - SW-JB-IDEA-ULT, SW-DOCKER-DESKTOP-PRO, SW-POSTMAN-TEAM
- ORD-2025-1003 (paid) - DEV-RPI-5-4GB, DEV-ADA-4884
- ORD-2025-1010 (paid) - KB-KCR-K8PRO, BK-YDKJSY-2E, SW-POSTMAN-TEAM

## TODO: Remove Before Production
Before deploying to production or completing the project:
1. Change the test user ID back to `USR-0001` in usersSeed.json
2. Update the corresponding orders back to `USR-0001` in ordersSeed.json
3. Remove the "(TEST USER - REMOVE LATER)" note from the user's name
4. Delete this note file
