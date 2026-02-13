# Logship-MVP: Business Requirements Document

**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Status:** Draft  
**Owner:** Product Team

---

## 1. Executive Summary

### 1.1. Problem Statement

**Current Market Gap:**
- Các nền tảng giao hàng lớn (Grab, Be, Gojek) tập trung vào đô thị lớn, bỏ qua các khu vực ngoại ô và đường nhỏ
- Chi phí cao cho các đơn hàng ngắn (< 5km)
- Thủ tục đăng ký tài xế phức tạp, rào cản cho ngườii muốn kiếm thêm thu nhập
- Thiếu minh bạch trong giá cả và thờii gian giao hàng

**Logship Solution:**
- Nền tảng giao hàng siêu địa phương (hyperlocal) tập trung vào Hồ Chí Minh
- Giá cố định 8.000đ/km, minh bạch, không phụ phí ẩn
- Đăng ký tài xế đơn giản, nhanh chóng
- Real-time tracking với cập nhật 30 giây/lần

### 1.2. Value Proposition

**For Customers:**
- ✅ Giá rẻ hơn 20-30% so với đối thủ cho đơn ngắn
- ✅ Giao hàng nhanh trong vòng 1 giờ (nội thành HCM)
- ✅ Theo dõi real-time, biết chính xác tài xế đang ở đâu
- ✅ Hủy miễn phí trong 5 phút

**For Drivers:**
- ✅ Nhận 85% giá đơn (cao hơn thị trường 70-75%)
- ✅ Linh hoạt thờii gian, không ép ca
- ✅ Đăng ký dễ dàng, không cần xe riêng (thuê xe cũng được)
- ✅ Thanh toán COD hàng ngày

**For Platform:**
- ✅ Mô hình commission 15%
- ✅ MVP 50 users active để validate
- ✅ Scalable architecture với NestJS + PostgreSQL

---

## 2. Market Analysis

### 2.1. Target Market

**Primary Market:**
- **Địa lý:** Thành phố Hồ Chí Minh (Quận 1, 3, 5, 10, Phú Nhuận, Bình Thạnh, Gò Vấp)
- **Dân số:** ~9 triệu ngườii
- **Tầng lớp:** Middle-class, Gen Z, Millennials

**Secondary Market (Future):**
- Hà Nội, Đà Nẵng (Phase 2)
- Các thành phố cấp 1 khác (Phase 3)

### 2.2. Market Size

**TAM (Total Addressable Market):**
- Thị trường giao hàng same-day VN: ~$500M/năm
- CAGR: 25%/năm

**SAM (Serviceable Addressable Market):**
- Giao hàng nội thành HCM: ~$150M/năm

**SOM (Serviceable Obtainable Market):**
- Mục tiêu MVP: 0.01% SAM = $15K/năm
- Target Year 1: 0.1% SAM = $150K/năm

### 2.3. Competitive Analysis

| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
| **Grab** | Brand recognition, ecosystem | High fees (25-30%), complex for drivers | Lower fees, simpler onboarding |
| **Be** | Vietnam-focused, motorbike focus | Limited coverage | Better UX, transparent pricing |
| **Gojek** | International experience | Not optimized for VN | Local optimization, Goong Maps |
| **Ahamove** | B2B focus | Weak B2C | B2C optimized, individual-friendly |
| **Loship** | Food delivery focus | Limited to food | General delivery, any item |

**Competitive Advantage:**
1. **Pricing:** 8.000đ/km cố định vs đối thủ tính theo công thức phức tạp
2. **Driver earnings:** 85% vs 70-75% thị trường
3. **Simplicity:** Không phụ phí, giá hiển thị ngay
4. **Speed:** Real-time tracking 30s vs đối thủ 1-2 phút

---

## 3. User Personas

### 3.1. Customer Persona: "Chị Lan - Chủ Shop Online"

**Demographics:**
- Age: 32
- Location: Quận 10, HCM
- Occupation: Chủ shop thờii trang online (Instagram/Facebook)
- Income: 15-20 triệu/tháng

**Pain Points:**
- Giao hàng cho khách tốn nhiều thờii gian
- Grab/Be quá đắt cho đơn gần (3-5km)
- Khách hàng complain không biết hàng đang ở đâu
- Hàng bị hủy vì tài xế đến trễ

**Goals:**
- Giao hàng nhanh, rẻ, đúng hẹn
- Theo dõi được đơn hàng real-time
- Giá minh bạch, không phụ phí bất ngờ

**Usage Pattern:**
- 5-10 đơn/ngày
- Đa số đơn 3-10km
- Thường giao giờ hành chính

### 3.2. Driver Persona: "Anh Minh - Sinh Viên Làm Thêm"

**Demographics:**
- Age: 22
- Location: Quận Gò Vấp, HCM
- Occupation: Sinh viên năm 3, làm thêm buổi tối
- Income: 5-7 triệu/tháng (gồm cả chạy xe)

**Pain Points:**
- Grab/Be giữ 25-30% hoa hồng quá cao
- Phải chạy ca cố định, không linh hoạt
- Thủ tục đăng ký phức tạp, mất thờii gian
- Khó kiểm tra thu nhập thực tế

**Goals:**
- Kiếm thêm 3-5 triệu/tháng
- Linh hoạt thờii gian (chỉ chạy tối và cuối tuần)
- Giữ được nhiều tiền nhất có thể
- Thanh toán nhanh, không chờ đợi

**Usage Pattern:**
- 3-4 giờ/ngày (tối)
- 15-20 đơn/tuần
- Thích đơn ngắn (3-7km)

---

## 4. Business Model

### 4.1. Revenue Streams

**Primary: Commission (15%)**
- Platform giữ 15% giá đơn
- Driver nhận 85%
- Example: Đơn 100.000đ → Platform 15.000đ, Driver 85.000đ

**Future Revenue Streams:**
- Premium features (priority matching, scheduled delivery)
- Advertising (promoted shops)
- Insurance upsell
- Data analytics (B2B)

### 4.2. Cost Structure

**Fixed Costs:**
- Infrastructure (Neon PostgreSQL, Vercel, Redis): ~$200/tháng
- Goong Maps API: ~$100/tháng (50 users)
- Firebase: ~$50/tháng
- Total: ~$350/tháng

**Variable Costs:**
- Customer support: $5/user/tháng
- Marketing: $10/user acquisition
- Payment processing: 2% per transaction

**Break-even Analysis:**
- Fixed costs: $350/tháng
- Avg order value: 80.000đ
- Commission per order: 12.000đ
- Break-even: 30 orders/month (~1 order/day)

### 4.3. Unit Economics

**Per Order (Average 10km):**
- Customer pays: 80.000đ
- Platform commission (15%): 12.000đ
- Driver earnings: 68.000đ

**Platform Costs per Order:**
- Maps API: 500đ
- SMS notification: 300đ
- Infrastructure: 200đ
- **Total cost: 1.000đ**

**Platform Profit per Order: 11.000đ (91.7% margin)**

---

## 5. Go-to-Market Strategy

### 5.1. Launch Strategy

**Phase 1: MVP (Month 1-2)**
- Soft launch với 50 beta users
- Tập trung Quận 10, Phú Nhuận (high density)
- Recruit 20 drivers từ sinh viên, ngườii làm tự do
- Word-of-mouth marketing

**Phase 2: Growth (Month 3-6)**
- Expand to 5 quận trung tâm
- Target 500 users active
- Social media marketing (Facebook, TikTok)
- Partnership với 50+ shop online

**Phase 3: Scale (Month 7-12)**
- Full HCM coverage
- Target 5.000 users active
- Corporate partnerships
- Driver referral program

### 5.2. Marketing Channels

**Digital Marketing:**
- Facebook Ads (target: 25-40 tuổi, HCM)
- TikTok organic content (driver stories, fast delivery)
- Google Ads (keywords: "giao hàng nhanh", "ship hàng rẻ")

**Partnerships:**
- Shop online (Instagram/Facebook sellers)
- Food bloggers, influencers
- Universities (student driver recruitment)

**Referral Program:**
- Customer: Giảm 20% đơn tiếp theo khi giới thiệu bạn
- Driver: Thưởng 100.000đ khi giới thiệu tài xế mới

### 5.3. Pricing Strategy

**Penetration Pricing:**
- Launch với giá 8.000đ/km (thấp hơn đối thủ 20-30%)
- First 3 đơn giảm 50% cho customer mới
- Driver bonus 500.000đ cho 10 đơn đầu tiên

**Long-term Pricing:**
- Maintain 8.000đ/km (competitive advantage)
- Introduce surge pricing (+20%) during peak hours only
- Volume discounts for corporate customers

---

## 6. Success Metrics (KPIs)

### 6.1. Business KPIs

| Metric | MVP Target (Month 3) | Year 1 Target |
|--------|---------------------|---------------|
| **Active Users** | 50 | 5,000 |
| **Active Drivers** | 20 | 500 |
| **Orders/Month** | 300 | 15,000 |
| **GMV/Month** | 24 triệu đồng | 1.2 tỷ đồng |
| **Revenue/Month** | 3.6 triệu đồng | 180 triệu đồng |
| **Customer Acquisition Cost** | < 100.000đ | < 50.000đ |
| **Driver Retention (30 days)** | > 60% | > 70% |

### 6.2. Product KPIs

| Metric | Target |
|--------|--------|
| **App Store Rating** | > 4.5 stars |
| **Driver App Rating** | > 4.5 stars |
| **Average Delivery Time** | < 45 minutes |
| **Order Cancellation Rate** | < 10% |
| **Customer Support Tickets** | < 5% of orders |
| **App Crash Rate** | < 1% |

### 6.3. Technical KPIs

| Metric | Target |
|--------|--------|
| **API Response Time (p95)** | < 200ms |
| **App Launch Time** | < 3 seconds |
| **System Uptime** | > 99.5% |
| **Database Query Time** | < 50ms |

---

## 7. Risk Analysis

### 7.1. Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Competitor price war** | High | High | Focus on service quality, driver earnings |
| **Low driver retention** | Medium | High | Higher commission (85%), flexible schedule |
| **Regulatory changes** | Low | High | Legal compliance, insurance |
| **Economic downturn** | Medium | Medium | Lower pricing, focus on essential deliveries |

### 7.2. Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Scalability issues** | Medium | High | Cloud-native architecture, auto-scaling |
| **Data breaches** | Low | Critical | Security best practices, encryption |
| **Third-party API failures** | Medium | Medium | Fallback strategies, caching |
| **Mobile app crashes** | Medium | High | Thorough testing, error monitoring |

---

## 8. Compliance & Legal Requirements

### 8.1. Data Protection

**GDPR/Vietnam Data Protection:**
- ✅ User consent for data collection
- ✅ Right to access, delete personal data
- ✅ Data encryption at rest and in transit
- ✅ Data retention policy (7 years for financial)

### 8.2. Driver Requirements

**Legal Requirements:**
- ✅ Valid driver's license (motorcycle/car)
- ✅ Vehicle registration (or rental agreement)
- ✅ Background check (criminal record)
- ✅ Insurance (platform-provided or personal)

### 8.3. Payment Compliance

**Current (COD):**
- ✅ No PCI DSS required (no card storage)
- ✅ Cash handling procedures
- ✅ Daily reconciliation

**Future (Online Payment):**
- ⬜ PCI DSS compliance needed
- ⬜ Payment gateway integration (Stripe, PayPal)
- ⬜ Fraud detection

### 8.4. Required Documents

**Before Launch:**
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Driver Agreement
- [ ] Insurance Policy
- [ ] Business Registration

---

## 9. Assumptions & Constraints

### 9.1. Key Assumptions

1. **Market Demand:** Có đủ nhu cầu giao hàng same-day ở HCM
2. **Driver Supply:** Đủ ngườii sẵn sàng làm tài xế với thu nhập 5-10 triệu/tháng
3. **Technology:** Expo SDK 54 + React Native 0.84.0 stable
4. **Regulatory:** Không có thay đổi lớn về quy định giao hàng

### 9.2. Constraints

1. **Budget:** MVP limited to $10K development cost
2. **Timeline:** 3 months to MVP launch
3. **Team:** 1-2 developers, 1 product manager
4. **Geography:** Chỉ HCM trong 6 tháng đầu

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | Technical architecture |
| [02-Database-Design-Document.md](./02-Database-Design-Document.md) | Database schema |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API specifications |
| [SECURITY.md](./SECURITY.md) | Security requirements |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment strategy |

---

**Last Updated:** February 13, 2026  
**Next Review:** After MVP launch (Month 3)
