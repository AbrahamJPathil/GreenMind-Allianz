# Project Showcase: GreenMind
## Allianz Tech Championship 2025 

**Role:** Sole Architect & Developer  
**Status:** National Winner (1st Place)  
**Award:** €3,000 Prize  

---

## 1. The Hackathon Context
The **Allianz Tech Championship 2025** was an incredible opportunity to test my engineering skills against real-world industry problems. The challenge was to bridge the gap between heavy cloud infrastructure and sustainability. Competing as a solo developer against top engineering students nationwide, my goal was to build a solution that wasn't just a theoretical concept, but a fully deployable prototype that actually worked.

---

## 2. The Core Problem: Gen-AI's Energy Cost
As developers, we are rushing to build with Generative AI, but we often ignore the massive computational cost and carbon footprint of keeping LLM infrastructure running 24/7. Traditional deployments keep GPU-heavy containers spinning even during idle times. The challenge I wanted to tackle was: *How do we build Gen-AI systems that are smart enough to pause themselves when the energy grid is dirty, and scale up when clean energy is available?*

---

## 3. The Architecture: Building GreenMind
**GreenMind** is an event-driven sustainability controller that I architected from scratch. It dynamically scales and routes AI workloads based on real-time grid conditions. 

Here is how I engineered the Proof of Concept (PoC) for the finals:

### The Backend Engine (The Orchestrator)
I wanted the backend to be as close to a real production environment as possible. 
* **API Layer:** I wrote a high-performance, asynchronous REST API using **FastAPI** to handle the incoming traffic.
* **Containerization:** The entire environment was packaged using **Docker** so it could be spun up anywhere without dependency issues.
* **Event-Driven Scaling:** The real magic happened in **Kubernetes**. I used **KEDA** (Kubernetes Event-driven Autoscaling) to write custom triggers. When my system detected a spike in the energy grid's carbon intensity, KEDA automatically spun down non-critical AI containers and queued the requests until greener energy was available.

### The Observability Stack: KEPLER & Prometheus
You can't optimize what you can't measure. To prove that GreenMind was actually saving energy, I needed enterprise-grade telemetry. 
* I deployed **Kepler (Kubernetes-based Efficient Power Level Exporter)** to act as the primary metric engine.
* To ensure data persistence and queryability, I paired Kepler with a central **Prometheus** server.
* **The Custom Exporter:** Instead of relying purely on high-level estimates, I wrote a custom script that extracted granular, kernel-level power metrics and exported them directly into Prometheus as time-series data. 
* During the final pitch, this was my secret weapon: I wasn't just talking about saving energy. I pulled up the live data to show the judges the exact, auditable carbon reduction mapped against container lifecycles.

### The Frontend (Telemetry Dashboard)
As an engineer, it's easy to get lost in the backend, but I knew the judges needed to *see* the system working. 
* Instead of building a bloated, overly complex UI, I focused on a clean, functional telemetry dashboard. 
* It consumed the FastAPI endpoints and displayed the live metrics: Active Containers, Real-Time Carbon Score, and a live log of containers being scaled up or down. It visualized the invisible backend logic perfectly.

---

## 4. The Takeaway
Winning the National Title and the €3,000 prize was a massive validation of my approach to engineering. It taught me that the best student projects don't just use the newest frameworks—they use the *right* frameworks to solve actual problems. GreenMind proved that with the right architecture, we can build high-performance cloud systems that are actively responsible for their own environmental impact.
