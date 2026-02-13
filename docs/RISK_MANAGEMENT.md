# Logship-MVP: Risk Management Plan

**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Status:** Active  
**Owner:** Project Manager

---

## 1. Risk Management Framework

### 1.1. Risk Categories

| Category | Description | Owner |
|----------|-------------|-------|
| **Technical** | Technology, architecture, implementation | Tech Lead |
| **Business** | Market, competition, revenue | Product Manager |
| **Operational** | Operations, logistics, drivers | Operations Manager |
| **Legal** | Compliance, regulations, contracts | Legal |
| **Financial** | Budget, costs, cash flow | CFO |

### 1.2. Risk Scoring Matrix

**Probability (P):**
- 1 - Rare (< 10%)
- 2 - Unlikely (10-30%)
- 3 - Possible (30-50%)
- 4 - Likely (50-70%)
- 5 - Almost Certain (> 70%)

**Impact (I):**
- 1 - Negligible (minimal impact)
- 2 - Minor (some delay/cost)
- 3 - Moderate (significant delay/cost)
- 4 - Major (project threatened)
- 5 - Critical (project failure)

**Risk Score = P × I**
- **15-25:** Critical (immediate action)
- **10-14:** High (action required)
- **5-9:** Medium (monitor)
- **1-4:** Low (accept)

---

## 2. Risk Register

### 2.1. Critical Risks (Score 15-25)

| ID | Risk | Category | P | I | Score | Mitigation | Owner |
|----|------|----------|---|---|-------|------------|-------|
| **R001** | Competitor price war (Grab/Be drop prices) | Business | 4 | 5 | **20** | Focus on service quality, driver earnings, niche markets | Product |
| **R002** | Low driver retention (< 50%) | Operational | 4 | 4 | **16** | 85% commission, flexible schedule, daily payment, driver support | Operations |
| **R003** | Technology stack issues (Expo/Prisma bugs) | Technical | 3 | 5 | **15** | Keep dependencies updated, maintain fallback options, active community support | Tech Lead |
| **R004** | Data breach (user data exposed) | Technical | 2 | 5 | **10** | Encryption, security audits, penetration testing, incident response plan | Security |

### 2.2. High Risks (Score 10-14)

| ID | Risk | Category | P | I | Score | Mitigation | Owner |
|----|------|----------|---|---|-------|------------|-------|
| **R005** | Regulatory changes (new delivery regulations) | Legal | 3 | 4 | **12** | Legal monitoring, flexible architecture, compliance team | Legal |
| **R006** | Insufficient customer demand | Business | 4 | 3 | **12** | Market research, MVP validation, pivot strategy | Product |
| **R007** | Payment delays (COD reconciliation issues) | Financial | 3 | 4 | **12** | Automated reconciliation, daily reports, clear payment terms | Finance |
| **R008** | App store rejection (iOS/Android) | Technical | 3 | 3 | **9** | Follow guidelines, beta testing, compliance review | Tech Lead |
| **R009** | Third-party API failures (Goong Maps, Firebase) | Technical | 4 | 3 | **12** | Fallback strategies, caching, SLA monitoring, backup providers | Tech Lead |
| **R010** | Driver safety incidents | Operational | 3 | 4 | **12** | Insurance, safety training, emergency procedures, incident reporting | Operations |

### 2.3. Medium Risks (Score 5-9)

| ID | Risk | Category | P | I | Score | Mitigation | Owner |
|----|------|----------|---|---|-------|------------|-------|
| **R011** | Budget overrun (> 20%) | Financial | 3 | 3 | **9** | Weekly budget tracking, contingency fund (20%), scope management | Finance |
| **R012** | Timeline delays (> 1 month) | Technical | 4 | 2 | **8** | Agile methodology, MVP scope, parallel workstreams, buffer time | PM |
| **R013** | Key person dependency (developer leaves) | Technical | 3 | 3 | **9** | Knowledge sharing, documentation, cross-training, pair programming | Tech Lead |
| **R014** | Poor app reviews (< 3.5 stars) | Business | 3 | 3 | **9** | Beta testing, user feedback, quick bug fixes, UX optimization | Product |
| **R015** | Customer fraud (fake orders) | Operational | 3 | 2 | **6** | Verification system, rating system, fraud detection, deposit for new users | Operations |

### 2.4. Low Risks (Score 1-4)

| ID | Risk | Category | P | I | Score | Mitigation | Owner |
|----|------|----------|---|---|-------|------------|-------|
| **R016** | Minor UI/UX issues | Technical | 4 | 1 | **4** | User testing, design system, iterative improvements | Design |
| **R017** | Documentation outdated | Technical | 5 | 1 | **5** | Regular reviews, automated checks, version control | Tech Lead |
| **R018** | Office/Workspace issues | Operational | 2 | 2 | **4** | Remote work policy, flexible workspace | Operations |

---

## 3. Contingency Plans

### 3.1. Competitor Price War (R001)

**Trigger:** Grab/Be reduce prices by > 20%

**Response:**
1. **Immediate (24 hours):**
   - Analyze competitor pricing
   - Survey driver sentiment
   - Monitor order volume

2. **Short-term (1 week):**
   - Launch loyalty program for drivers
   - Increase driver incentives
   - Focus marketing on service quality (not price)

3. **Long-term (1 month):**
   - Negotiate better rates with suppliers
   - Optimize operational costs
   - Consider niche markets (B2B, specific districts)

**Fallback:** Pivot to B2B delivery only

### 3.2. Low Driver Retention (R002)

**Trigger:** Driver retention < 50% after 30 days

**Response:**
1. **Immediate:**
   - Exit interviews with leaving drivers
   - Increase commission temporarily (85% → 90%)
   - Launch driver referral bonus (500K VND)

2. **Short-term:**
   - Improve driver app UX
   - Add driver support hotline
   - Create driver community/forum

3. **Long-term:**
   - Driver loyalty program
   - Health insurance partnership
   - Vehicle rental partnership

**Fallback:** Increase marketing spend for driver acquisition

### 3.3. Technology Stack Issues (R003)

**Trigger:** Critical bug in Expo/Prisma/NestJS blocking development

**Response:**
1. **Immediate:**
   - Check GitHub issues for workarounds
   - Contact framework support
   - Rollback to previous stable version

2. **Short-term:**
   - Implement temporary fix
   - Monitor for official patch
   - Document workaround

3. **Long-term:**
   - Evaluate alternative frameworks
   - Maintain technical debt backlog
   - Plan migration if needed

**Fallback:** Switch to alternative technology (documented in ADRs)

### 3.4. Data Breach (R004)

**Trigger:** Unauthorized access to user data detected

**Response:**
1. **Immediate (0-1 hour):**
   - Activate incident response team
   - Isolate affected systems
   - Preserve evidence

2. **Short-term (1-24 hours):**
   - Assess scope of breach
   - Notify affected users
   - Report to authorities (if required)

3. **Long-term (1-7 days):**
   - Root cause analysis
   - Implement security improvements
   - Legal review and compliance

**Fallback:** Engage external security firm

---

## 4. Risk Monitoring

### 4.1. Monitoring Frequency

| Risk Level | Review Frequency | Reporting |
|------------|------------------|-----------|
| **Critical** | Daily | Immediate escalation |
| **High** | Weekly | Weekly report |
| **Medium** | Bi-weekly | Monthly report |
| **Low** | Monthly | Quarterly report |

### 4.2. Risk Metrics Dashboard

**Key Risk Indicators (KRIs):**

| KRI | Target | Warning | Critical |
|-----|--------|---------|----------|
| Driver retention (30d) | > 70% | 50-70% | < 50% |
| Customer acquisition cost | < 50K VND | 50-100K | > 100K |
| App crash rate | < 1% | 1-3% | > 3% |
| API error rate | < 0.1% | 0.1-1% | > 1% |
| Budget variance | < 10% | 10-20% | > 20% |
| Timeline variance | < 1 week | 1-2 weeks | > 2 weeks |

### 4.3. Risk Review Process

**Weekly Risk Review (Monday 10:00 AM):**
- Review critical and high risks
- Update risk scores
- Assign new mitigation actions
- Escalate if needed

**Monthly Risk Review (First Monday):**
- Review all risks
- Analyze trends
- Update risk register
- Report to stakeholders

**Quarterly Risk Assessment:**
- Comprehensive risk review
- Scenario planning
- Update contingency plans
- Board reporting

---

## 5. Risk Communication

### 5.1. Escalation Matrix

| Risk Score | Action | Timeline | Notify |
|------------|--------|----------|--------|
| **20-25** | Immediate action | 1 hour | CEO, CTO, Board |
| **15-19** | Urgent action | 4 hours | CTO, PM |
| **10-14** | Action required | 24 hours | PM, Tech Lead |
| **5-9** | Monitor | 1 week | Team Lead |
| **1-4** | Accept | Monthly | None |

### 5.2. Risk Communication Plan

**Internal:**
- **Daily:** Critical risks (Slack #risk-alerts)
- **Weekly:** Risk register update (Email)
- **Monthly:** Risk report (Meeting + Document)

**External:**
- **Investors:** Quarterly risk report
- **Partners:** As needed (NDA protected)
- **Customers:** Only if impacted (transparent communication)

---

## 6. Risk Response Strategies

### 6.1. Response Types

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **Avoid** | High impact, high probability | Don't enter market with strong competitor |
| **Mitigate** | Reduce probability or impact | Add redundancy, improve testing |
| **Transfer** | Financial risks | Insurance, outsourcing |
| **Accept** | Low impact, low probability | Minor UI issues |
| **Exploit** | Positive risks (opportunities) | Early market entry |

### 6.2. Risk Budget

**Contingency Reserve:** 20% of project budget
- Technical risks: 10%
- Business risks: 5%
- Operational risks: 5%

**Management Reserve:** 10% of project budget
- Unknown unknowns
- Executive approval required

---

## 7. Lessons Learned

### 7.1. Post-Incident Reviews

After each risk event:
1. What happened?
2. Why did it happen?
3. How well did we respond?
4. What could we do better?
5. What changes are needed?

### 7.2. Continuous Improvement

- Update risk register monthly
- Refine mitigation strategies
- Improve early warning indicators
- Share lessons across teams

---

## 8. Related Documents

| Document | Description |
|----------|-------------|
| [BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md) | Business context |
| [SECURITY.md](./SECURITY.md) | Security risks |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Operational risks |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | Technical architecture |

---

**Last Updated:** February 13, 2026  
**Next Review:** Weekly (Mondays)  
**Risk Owner:** Project Manager  
**Contact:** pm@logship.vn
