# SevaSetu Scheme Data Verification Checklist

> [!IMPORTANT]
> Because SevaSetu operates without live scraping or automated crawling of authenticated government portals, all scheme data records in `data/schemes.json` are initially flagged with `data_status: "UNVERIFIED"`.
> 
> Before any public deployment or live hackathon demo, the evaluation and verification team must review the official Andhra Pradesh government portals listed below and verify all parameters against the latest Government Orders (G.O.s).

---

## 1. Scheme-by-Scheme Audit Checklist

### 1.1 YSR Rythu Bharosa (`ap-ysr-rythu-bharosa`)
- **Official Portal**: [https://ysrrythubharosa.ap.gov.in](https://ysrrythubharosa.ap.gov.in)
- **Primary Department**: Department of Agriculture, Government of Andhra Pradesh
- **Key Fields to Verify**:
  - [ ] **Annual Assistance Amount**: Verify current financial year payout (currently ₹13,500/year in 3 tranches or updated under latest budgetary revision).
  - [ ] **Land Holding Ceiling**: Check whether max land holding ceiling remains 5.0 acres for small & marginal category.
  - [ ] **Tenant Farmer Eligibility**: Verify requirements for Crop Cultivator Rights Card (CCRC) and lease duration.
  - [ ] **Exclusions**: Verify exclusions (income tax payees, active government pensioners, elected representatives).
  - [ ] **Helpline**: Check active 24/7 toll-free helpline (recorded as `1902`).

### 1.2 YSR Pension Kanuka (`ap-ysr-pension-kanuka`)
- **Official Portal**: [https://sspensions.ap.gov.in](https://sspensions.ap.gov.in)
- **Primary Department**: Society for Elimination of Rural Poverty (SERP) / PR & RD
- **Key Fields to Verify**:
  - [ ] **Old Age Pension Age Threshold**: Verify whether minimum cutoff is 60 or 62 years.
  - [ ] **Monthly Amount**: Verify base pension amount (₹3,000/month for OAP/Widow; ₹4,000 for disability or higher).
  - [ ] **Disability Percentage Cutoff**: Verify SADAREM portal threshold (min 40% certified disability).
  - [ ] **Income Ceilings**: Confirm rural limit (₹1,20,000/yr) and urban limit (₹1,44,000/yr).
  - [ ] **Doorstep Delivery Protocol**: Confirm Grama/Ward Sachivalayam role in monthly 1st-of-month cash distribution.

### 1.3 Dr. YSR Aarogyasri (`ap-ysr-aarogyasri`)
- **Official Portal**: [https://aarogyasri.ap.gov.in](https://aarogyasri.ap.gov.in)
- **Primary Department**: Dr. YSR Aarogyasri Health Care Trust
- **Key Fields to Verify**:
  - [ ] **Coverage Ceiling**: Confirm enhanced financial coverage cap (₹25,00,000 per family per annum).
  - [ ] **Empanelled Packages**: Verify count of covered medical & surgical procedures (approx 3,257 procedures).
  - [ ] **Card Requirement**: Confirm eligibility criteria for White Ration Card / Rice Card holders without physical health card.
  - [ ] **Emergency Contact**: Verify toll-free 104 helpline.

### 1.4 YSR Cheyutha (`ap-ysr-cheyutha`)
- **Official Portal**: [https://navasakam.ap.gov.in](https://navasakam.ap.gov.in)
- **Primary Department**: Department of Social Welfare / BC Welfare
- **Key Fields to Verify**:
  - [ ] **Age Window**: Confirm minimum 45 years and maximum 60 years on the cutoff date.
  - [ ] **Caste Inclusions**: Confirm SC, ST, BC, and Minority communities coverage.
  - [ ] **Installment Amount**: Confirm ₹18,750 per year (totaling ₹75,000 over 4 years).
  - [ ] **Household Income Limit**: Verify rural vs urban income thresholds.

### 1.5 YSR Netanna Nestham (`ap-ysr-netanna-nestham`)
- **Official Portal**: [https://navasakam.ap.gov.in](https://navasakam.ap.gov.in)
- **Primary Department**: Department of Handlooms and Textiles
- **Key Fields to Verify**:
  - [ ] **Grant Amount**: Verify annual direct benefit amount of ₹24,000.
  - [ ] **Handloom Ownership**: Verify geo-tagging protocol and physical loom inspection guidelines.
  - [ ] **Artisan Card**: Check whether handloom co-operative membership is mandatory or independent weavers qualify.

### 1.6 Jagananna Ammavodi (`ap-jagananna-ammavodi`)
- **Official Portal**: [https://jaganannaammavodi.ap.gov.in](https://jaganannaammavodi.ap.gov.in)
- **Primary Department**: Department of School Education
- **Key Fields to Verify**:
  - [ ] **Assistance Amount**: Confirm ₹15,000 per year (and any deduction for school maintenance fund e.g. ₹2,000 net ₹13,000).
  - [ ] **Attendance Criterion**: Verify mandatory minimum 75% student attendance requirement.
  - [ ] **Classes Covered**: Verify coverage from Class 1 to Class 12 (Intermediate).
  - [ ] **Recipient Account**: Verify whether account must exclusively be the mother's Aadhaar-seeded bank account.

---

## 2. Verification Protocol for Human Auditors

1. **Access Government Portals**: Access each portal from an authorized network.
2. **Review Citizen Charters & G.O. Repository**: Download the latest relevant Government Orders for the ongoing financial year.
3. **Cross-Check Rules & Limits**:
   - Compare numeric limits in `data/schemes.json` (`numeric_max`, `numeric_min`).
   - Compare document checklists (`required_documents`).
   - Verify workflow offices (Grama Sachivalayam, MPDO, RBK, Hospital Kiosk).
4. **Update Status**:
   - When verified, update `data_status: "VERIFIED"` and record `last_verified_date: "YYYY-MM-DD"`.
   - Clear or update `verification_notes` with the verified G.O. number and date.
5. **Run Test Suite**: Run `npm test` to ensure golden tests pass with updated verified values.
