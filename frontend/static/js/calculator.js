// ========================================
// GreenMind Calculator JavaScript
// Multi-Cloud Carbon & Cost Calculations
// ========================================

// Configuration
const PUE = 1.57; // Power Usage Effectiveness

// === SPRINT 17: HEURISTIC MODEL FOR FINE-TUNING ADVISOR ===
const HEURISTIC_MODEL = {
    "Small (e.g., Llama 8B)": {
        "Small (<10k samples)": {
            recommendation_text: "A 'Pro' GPU is sufficient for this task.",
            hw: "NVIDIA RTX 4090 (GPU)",
            num: 1,
            f_units: 10000,
            prep_hours: 1,
            train_hours: 2,
            tune_hours: 1
        },
        "Medium (<500k samples)": {
            recommendation_text: "A single Datacenter GPU is recommended for this dataset size.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 1,
            f_units: 500000,
            prep_hours: 4,
            train_hours: 8,
            tune_hours: 2
        },
        "Large (1M+ samples)": {
            recommendation_text: "A Multi-GPU Cluster is recommended to process this large dataset in a reasonable time.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 8,
            f_units: 1000000,
            prep_hours: 8,
            train_hours: 4,
            tune_hours: 2
        }
    },
    "Medium (e.g., Llama 70B)": {
        "Small (<10k samples)": {
            recommendation_text: "A single Datacenter GPU is the baseline for this model size.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 1,
            f_units: 10000,
            prep_hours: 2,
            train_hours: 4,
            tune_hours: 2
        },
        "Medium (<500k samples)": {
            recommendation_text: "A Multi-GPU Cluster is required to fine-tune this model.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 8,
            f_units: 500000,
            prep_hours: 10,
            train_hours: 10,
            tune_hours: 4
        },
        "Large (1M+ samples)": {
            recommendation_text: "A large Multi-GPU Cluster is required for this workload.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 8,
            f_units: 1000000,
            prep_hours: 20,
            train_hours: 20,
            tune_hours: 8
        }
    },
    "Large (e.g., GPT-3 175B)": {
        "Small (<10k samples)": {
            recommendation_text: "A Multi-GPU Cluster is the baseline for this model size.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 8,
            f_units: 10000,
            prep_hours: 5,
            train_hours: 3,
            tune_hours: 1
        },
        "Medium (<500k samples)": {
            recommendation_text: "A large Multi-GPU Cluster is required for this workload.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 8,
            f_units: 500000,
            prep_hours: 20,
            train_hours: 40,
            tune_hours: 10
        },
        "Large (1M+ samples)": {
            recommendation_text: "A very large Multi-GPU Cluster is required for this workload.",
            hw: "NVIDIA A100 80GB (GPU)",
            num: 16,
            f_units: 1000000,
            prep_hours: 40,
            train_hours: 75,
            tune_hours: 20
        }
    }
};

// Hardware Data (from app.py)
const HARDWARE_DATA = {
    "NVIDIA A100 80GB (GPU)": {
        TDP_watts: 300,
        cost_per_hour: 1.50,
        Optimizers: {
            "None (Naive Python Server)": 1.0,
            "Nvidia Triton (Recommended)": 0.7,
            "TorchServe / TF Serving": 0.85
        }
    },
    "NVIDIA RTX 4090 (GPU)": {
        TDP_watts: 450,
        cost_per_hour: 0.40,
        Optimizers: {
            "None (Naive Python Server)": 1.0,
            "Nvidia Triton (Recommended)": 0.7,
            "TorchServe / TF Serving": 0.85
        }
    },
    "AMD Instinct MI250 (GPU)": {
        TDP_watts: 500,
        cost_per_hour: 1.60,
        Optimizers: {
            "None (Naive Python Server)": 1.0,
            "Triton (ROCm Backend)": 0.75,
            "KServe (ROCm)": 0.8
        }
    },
    "Intel Xeon VM (8-vCPU)": {
        TDP_watts: 58,
        cost_per_hour: 0.41,
        Optimizers: {
            "None (Naive Python Server)": 1.0,
            "Intel OpenVINO (Recommended)": 0.5
        }
    },
    "AMD EPYC VM (8-vCPU)": {
        TDP_watts: 30,
        cost_per_hour: 0.34,
        Optimizers: {
            "None (Naive Python Server)": 1.0,
            "AMD ZenDNN (Recommended)": 0.6
        }
    }
};

// Cloud Provider Data (from app.py - abbreviated for demo)
const CLOUD_PROVIDER_DATA = {
    "GCP": {
        "us-east4 (N. Virginia, USA)": {
            carbon_intensity_g: 396,
            latency_ms: { usa: 8, europe: 90, asia: 210 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.70, "NVIDIA RTX 4090 (GPU)": 0.55,
                "AMD Instinct MI250 (GPU)": 1.80, "Intel Xeon VM (8-vCPU)": 0.41,
                "AMD EPYC VM (8-vCPU)": 0.38
            }
        },
        "europe-west1 (Belgium, EU)": {
            carbon_intensity_g: 46,
            latency_ms: { usa: 90, europe: 12, asia: 140 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.75, "NVIDIA RTX 4090 (GPU)": 0.60,
                "AMD Instinct MI250 (GPU)": 1.85, "Intel Xeon VM (8-vCPU)": 0.43,
                "AMD EPYC VM (8-vCPU)": 0.40
            }
        },
        "asia-south1 (Mumbai, IN)": {
            carbon_intensity_g: 713,
            latency_ms: { usa: 210, europe: 140, asia: 10 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.85, "NVIDIA RTX 4090 (GPU)": 0.65,
                "AMD Instinct MI250 (GPU)": 1.90, "Intel Xeon VM (8-vCPU)": 0.45,
                "AMD EPYC VM (8-vCPU)": 0.42
            }
        }
    },
    "AWS": {
        "us-east-1 (N. Virginia, USA)": {
            carbon_intensity_g: 396,
            latency_ms: { usa: 8, europe: 90, asia: 210 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.80, "NVIDIA RTX 4090 (GPU)": 0.60,
                "AMD Instinct MI250 (GPU)": 1.90, "Intel Xeon VM (8-vCPU)": 0.43,
                "AMD EPYC VM (8-vCPU)": 0.39
            }
        },
        "eu-central-1 (Frankfurt, DE)": {
            carbon_intensity_g: 352,
            latency_ms: { usa: 92, europe: 10, asia: 145 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.85, "NVIDIA RTX 4090 (GPU)": 0.65,
                "AMD Instinct MI250 (GPU)": 1.95, "Intel Xeon VM (8-vCPU)": 0.45,
                "AMD EPYC VM (8-vCPU)": 0.41
            }
        },
        "ap-south-1 (Mumbai, IN)": {
            carbon_intensity_g: 713,
            latency_ms: { usa: 210, europe: 140, asia: 10 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.95, "NVIDIA RTX 4090 (GPU)": 0.70,
                "AMD Instinct MI250 (GPU)": 2.05, "Intel Xeon VM (8-vCPU)": 0.48,
                "AMD EPYC VM (8-vCPU)": 0.44
            }
        }
    },
    "Azure": {
        "East US (Virginia, USA)": {
            carbon_intensity_g: 396,
            latency_ms: { usa: 8, europe: 90, asia: 210 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.82, "NVIDIA RTX 4090 (GPU)": 0.62,
                "AMD Instinct MI250 (GPU)": 1.92, "Intel Xeon VM (8-vCPU)": 0.44,
                "AMD EPYC VM (8-vCPU)": 0.40
            }
        },
        "West Europe (Netherlands, NL)": {
            carbon_intensity_g: 382,
            latency_ms: { usa: 88, europe: 10, asia: 142 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.88, "NVIDIA RTX 4090 (GPU)": 0.68,
                "AMD Instinct MI250 (GPU)": 1.98, "Intel Xeon VM (8-vCPU)": 0.46,
                "AMD EPYC VM (8-vCPU)": 0.42
            }
        },
        "Central India (Pune, IN)": {
            carbon_intensity_g: 713,
            latency_ms: { usa: 210, europe: 140, asia: 10 },
            pricing_per_hr: {
                "NVIDIA A100 80GB (GPU)": 1.98, "NVIDIA RTX 4090 (GPU)": 0.72,
                "AMD Instinct MI250 (GPU)": 2.10, "Intel Xeon VM (8-vCPU)": 0.50,
                "AMD EPYC VM (8-vCPU)": 0.45
            }
        }
    }
};

// Knowledge Base for AI Assistant
const KNOWLEDGE_BASE = {
    "tdp": "TDP (Thermal Design Power): The maximum power in watts a hardware component (like a GPU or CPU) is designed to use. We use this as a base for our energy calculation.",
    "pue": "PUE (Power Usage Effectiveness): A score that measures data center energy efficiency. A PUE of 1.57 means for every 1 watt of power the computer uses, 0.57 watts are used for cooling and lights.",
    "carbon intensity": "Carbon Intensity (g/kWh): A measure of how 'clean' the electricity is. It's the grams of CO2 emitted to create one kilowatt-hour of electricity. A low number (like in France) is good. A high number (like in India) is bad.",
    "sci": "SCI (Software Carbon Intensity): The official industry standard. It's a rate of carbon emissions per request (e.g., 'grams of CO2 per user'). It's the best way to measure the footprint of a live application.",
    "triton": "Nvidia Triton: A software 'manager' for NVIDIA GPUs. It makes them run AI models much faster and more efficiently, which saves time, money, and CO2.",
    "openvino": "Intel OpenVINO: A software 'manager' for Intel CPUs. It's like Triton but specialized for running AI on CPUs, making them incredibly fast and efficient.",
    "zendnn": "AMD ZenDNN: A software 'manager' for AMD CPUs. It's the AMD equivalent of OpenVINO.",
    "latency": "Latency (ms): The 'lag' a user experiences. It's the time in milliseconds for a request to go from the user to the data center and back. Low latency is good."
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeFormControls();
    initializeCalculator();
    initializeChat();
    updateOptimizerOptions();
    initializeAdvisor();        // Sprint 17: Fine-Tuning Advisor
    initializeWorkloadToggle(); // Sprint 16: Workload Type Toggle
    initializePipelineBuilder(); // Sprint 16: Pipeline Builder
});

// ========================================
// TAB SYSTEM
// ========================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });
}

// ========================================
// FORM CONTROLS
// ========================================

function initializeFormControls() {
    // Range sliders - update display values
    const ranges = [
        { slider: 'processing-hours', display: 'hours-value' },
        { slider: 'weight-cost', display: 'cost-value' },
        { slider: 'weight-sustainability', display: 'sustainability-value' },
        { slider: 'weight-performance', display: 'performance-value' },
        { slider: 'task-complexity', display: 'complexity-value' }
    ];

    ranges.forEach(range => {
        const slider = document.getElementById(range.slider);
        const display = document.getElementById(range.display);
        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value;
            });
        }
    });

    // Workload type change - show/hide user distribution
    const workloadType = document.getElementById('workload-type');
    const userDistSection = document.getElementById('user-distribution-section');
    const performanceWeight = document.getElementById('performance-weight-group');

    workloadType.addEventListener('change', (e) => {
        if (e.target.value === 'live') {
            userDistSection.style.display = 'block';
            performanceWeight.style.display = 'block';
        } else {
            userDistSection.style.display = 'none';
            performanceWeight.style.display = 'none';
        }
    });

    // Hardware profile change - update optimizer options
    const hardwareProfile = document.getElementById('hardware-profile');
    hardwareProfile.addEventListener('change', updateOptimizerOptions);

    // Distribution validation
    const distInputs = ['dist-usa', 'dist-europe', 'dist-asia'];
    distInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', validateDistribution);
    });
}

function updateOptimizerOptions() {
    const hardwareProfile = document.getElementById('hardware-profile').value;
    const optimizer = document.getElementById('optimizer');
    const optimizers = HARDWARE_DATA[hardwareProfile].Optimizers;

    optimizer.innerHTML = '';
    Object.entries(optimizers).forEach(([name, factor]) => {
        const option = document.createElement('option');
        option.value = factor;
        option.textContent = name;
        if (name.includes('Recommended') || factor === Math.min(...Object.values(optimizers))) {
            option.selected = true;
        }
        optimizer.appendChild(option);
    });
}

function validateDistribution() {
    const usa = parseInt(document.getElementById('dist-usa').value) || 0;
    const europe = parseInt(document.getElementById('dist-europe').value) || 0;
    const asia = parseInt(document.getElementById('dist-asia').value) || 0;
    const total = usa + europe + asia;
    const warning = document.getElementById('distribution-warning');

    if (total !== 100) {
        warning.style.display = 'block';
        return false;
    } else {
        warning.style.display = 'none';
        return true;
    }
}

// ========================================
// CALCULATION LOGIC
// ========================================

function initializeCalculator() {
    const calculateBtn = document.getElementById('calculate-btn');
    calculateBtn.addEventListener('click', runCalculation);

    const methodologyToggle = document.getElementById('methodology-toggle');
    if (methodologyToggle) {
        methodologyToggle.addEventListener('click', () => {
            const content = document.getElementById('methodology-content');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                methodologyToggle.textContent = 'Hide Methodology';
            } else {
                content.style.display = 'none';
                methodologyToggle.textContent = 'Show Methodology';
            }
        });
    }
}

function runCalculation() {
    const workloadType = document.getElementById('workload-type').value;
    
    // Route to appropriate calculation
    if (workloadType === 'live') {
        runSimpleCalculation();
    } else {
        runPipelineCalculation();
    }
}

// Simple calculation (Live Applications)
function runSimpleCalculation() {
    // Get form values
    const workloadType = 'live';
    const hardwareProfile = document.getElementById('hardware-profile').value;
    const optimizationFactor = parseFloat(document.getElementById('optimizer').value);
    const numUnits = parseInt(document.getElementById('num-units').value);
    const functionalUnits = parseInt(document.getElementById('functional-units').value);
    const hours = parseInt(document.getElementById('processing-hours').value);
    
    const distUSA = parseInt(document.getElementById('dist-usa').value);
    const distEurope = parseInt(document.getElementById('dist-europe').value);
    const distAsia = parseInt(document.getElementById('dist-asia').value);
    
    const weightCost = parseInt(document.getElementById('weight-cost').value);
    const weightSustainability = parseInt(document.getElementById('weight-sustainability').value);
    const weightPerformance = parseInt(document.getElementById('weight-performance').value);
    const sustainabilityMetric = document.getElementById('sustainability-metric').value;

    // Validation
    if (!validateDistribution()) {
        alert('Error: User distribution percentages must add up to 100%.');
        return;
    }

    const totalWeight = weightCost + weightSustainability + weightPerformance;
    if (totalWeight === 0) {
        alert('Error: Please assign some importance to your strategic priorities.');
        return;
    }

    // Get selected providers
    const selectedProviders = Array.from(document.querySelectorAll('.provider-selection input:checked'))
        .map(cb => cb.value);

    if (selectedProviders.length === 0) {
        alert('Error: Please select at least one cloud provider.');
        return;
    }

    // Get hardware data
    const hardwareInfo = HARDWARE_DATA[hardwareProfile];
    const hardwareTDP = hardwareInfo.TDP_watts;

    // Calculate results for all combinations
    const results = [];

    selectedProviders.forEach(provider => {
        Object.entries(CLOUD_PROVIDER_DATA[provider]).forEach(([region, data]) => {
            try {
                const costPerHour = data.pricing_per_hr[hardwareProfile];
                
                // Energy and cost calculation
                const effectiveHours = hours * optimizationFactor;
                const totalRunHours = numUnits * effectiveHours;
                const itEnergyKWh = (hardwareTDP / 1000) * totalRunHours;
                const totalEnergyKWh = itEnergyKWh * PUE;
                const totalCost = costPerHour * totalRunHours;

                // CO2 calculation
                const carbonIntensityKg = data.carbon_intensity_g / 1000;
                const totalCO2Kg = totalEnergyKWh * carbonIntensityKg;

                // SCI calculation
                const sciScore = (totalCO2Kg * 1000) / functionalUnits;

                // Latency calculation
                const weightedLatency = (
                    (distUSA / 100) * data.latency_ms.usa +
                    (distEurope / 100) * data.latency_ms.europe +
                    (distAsia / 100) * data.latency_ms.asia
                );

                results.push({
                    provider,
                    location: region,
                    totalCost,
                    co2Kg: totalCO2Kg,
                    sciScore,
                    avgLatency: weightedLatency,
                    carbonIntensity: data.carbon_intensity_g
                });
            } catch (error) {
                console.warn(`Skipping ${provider} - ${region}: ${error.message}`);
            }
        });
    });

    // Normalize and score
    if (results.length > 0) {
        const normalize = (arr, key) => {
            const values = arr.map(r => r[key]);
            const min = Math.min(...values);
            const max = Math.max(...values);
            return (max - min) > 0 ? arr.map(r => ({
                ...r,
                [`${key}Score`]: (r[key] - min) / (max - min)
            })) : arr.map(r => ({...r, [`${key}Score`]: 0}));
        };

        let scoredResults = normalize(results, 'totalCost');
        scoredResults = normalize(scoredResults, 'co2Kg');
        scoredResults = normalize(scoredResults, 'sciScore');
        scoredResults = normalize(scoredResults, 'avgLatency');

        // Calculate overall score
        const wCost = weightCost / totalWeight;
        const wSustainability = weightSustainability / totalWeight;
        const wPerformance = weightPerformance / totalWeight;

        scoredResults.forEach(result => {
            const sustainabilityScore = sustainabilityMetric === 'sci' ? result.sciScoreScore : result.co2KgScore;
            result.overallScore = (
                wCost * result.totalCostScore +
                wSustainability * sustainabilityScore +
                wPerformance * result.avgLatencyScore
            );
        });

        // Sort by overall score
        scoredResults.sort((a, b) => a.overallScore - b.overallScore);

        // Display results
        displayResults(scoredResults, workloadType, hardwareProfile, document.getElementById('optimizer').selectedOptions[0].text, sustainabilityMetric, weightCost, weightSustainability, weightPerformance);
    }
}

// ========================================
// QUICK WIN: RECOMMENDATIONS ENGINE
// ========================================

function generateRecommendations(results, currentSelection, workloadType, hardware) {
    /**
     * Generates actionable sustainability recommendations based on calculation results.
     * @param {Array} results - All calculated results sorted by score
     * @param {Object} currentSelection - The top recommended option
     * @param {String} workloadType - 'live' or 'training'
     * @param {String} hardware - Selected hardware profile
     * @returns {Array} Array of recommendation objects
     */
    const recommendations = [];
    
    if (results.length === 0) {
        return recommendations;
    }
    
    // Sort by CO2 to find greenest option
    const sortedByCO2 = [...results].sort((a, b) => a.co2Kg - b.co2Kg);
    const greenest = sortedByCO2[0];
    const currentCO2 = currentSelection.co2Kg;
    
    // Recommendation 1: Switch to Greener Region
    if (greenest.co2Kg < currentCO2 * 0.80) { // 20%+ improvement available
        const co2Reduction = currentCO2 - greenest.co2Kg;
        const reductionPercent = ((co2Reduction / currentCO2) * 100).toFixed(0);
        recommendations.push({
            type: 'Region Migration',
            title: `Switch to ${greenest.location}`,
            description: `Migrate from ${currentSelection.location} to ${greenest.location} for significantly lower carbon intensity.`,
            impact: `Save ${co2Reduction.toFixed(1)} kg CO2 (${reductionPercent}% reduction)`,
            effort: 'Low',
            priority: 'High'
        });
    }
    
    // Recommendation 2: Temporal Shifting (for training workloads)
    if (workloadType === 'training') {
        recommendations.push({
            type: 'Carbon-Aware Scheduling',
            title: 'Schedule During Off-Peak Hours',
            description: 'Run training jobs when grid electricity is greenest (typically 2-6 AM local time when renewable energy is abundant).',
            impact: 'Potential 20-40% CO2 reduction',
            effort: 'Medium',
            priority: 'High'
        });
    }
    
    // Recommendation 3: Model Optimization
    if (workloadType === 'live') {
        recommendations.push({
            type: 'Model Quantization',
            title: 'Apply INT8 Quantization',
            description: 'Reduce model precision from FP32 to INT8 for up to 75% energy reduction with minimal accuracy loss.',
            impact: 'Up to 75% energy reduction',
            effort: 'Medium',
            priority: 'Medium'
        });
    }
    
    // Recommendation 4: Hardware Optimization (if using GPU)
    if (hardware.includes('GPU')) {
        recommendations.push({
            type: 'Batch Processing',
            title: 'Enable Dynamic Batching',
            description: 'Use Triton Inference Server or TorchServe with dynamic batching to improve GPU utilization by 40-60%.',
            impact: '40-60% energy efficiency gain',
            effort: 'Medium',
            priority: 'Medium'
        });
    }
    
    // Recommendation 5: Multi-Region Load Balancing
    if (workloadType === 'live') {
        // Find regions with low carbon intensity
        const medianCO2 = results[Math.floor(results.length / 2)].co2Kg;
        const lowCarbonRegions = results.filter(r => r.co2Kg < medianCO2);
        
        if (lowCarbonRegions.length >= 2) {
            recommendations.push({
                type: 'Geographic Load Balancing',
                title: 'Implement Carbon-Aware Routing',
                description: 'Route user requests to the greenest available region based on real-time carbon intensity data.',
                impact: '15-30% CO2 reduction',
                effort: 'High',
                priority: 'Low'
            });
        }
    }
    
    // Recommendation 6: Cost Optimization
    const sortedByCost = [...results].sort((a, b) => a.totalCost - b.totalCost);
    const cheapest = sortedByCost[0];
    const currentCost = currentSelection.totalCost;
    
    if (cheapest.totalCost < currentCost * 0.70) { // 30%+ cost reduction available
        const costReduction = currentCost - cheapest.totalCost;
        const costPercent = ((costReduction / currentCost) * 100).toFixed(0);
        recommendations.push({
            type: 'Cost Optimization',
            title: `Consider ${cheapest.provider} in ${cheapest.location}`,
            description: 'This option offers significant cost savings while maintaining similar performance.',
            impact: `Save $${costReduction.toFixed(2)} (${costPercent}% reduction)`,
            effort: 'Low',
            priority: 'Medium'
        });
    }
    
    return recommendations;
}

function displayRecommendations(results, currentSelection, workloadType, hardware) {
    /**
     * Displays sustainability recommendations in the results section.
     */
    const recommendations = generateRecommendations(results, currentSelection, workloadType, hardware);
    
    // Create or get recommendations container
    let recommendationsContainer = document.getElementById('recommendations-panel');
    if (!recommendationsContainer) {
        recommendationsContainer = document.createElement('div');
        recommendationsContainer.id = 'recommendations-panel';
        recommendationsContainer.className = 'recommendations-panel';
        
        // Insert after top recommendation
        const topRecommendation = document.getElementById('top-recommendation');
        topRecommendation.parentNode.insertBefore(recommendationsContainer, topRecommendation.nextSibling);
    }
    
    if (recommendations.length === 0) {
        recommendationsContainer.innerHTML = `
            <h3>Sustainability Recommendations</h3>
            <div class="recommendation-card info">
                <p>No additional recommendations at this time. Your current setup is already well-optimized!</p>
            </div>
        `;
        return;
    }
    
    // Build recommendations HTML
    let html = '<h3>Sustainability Recommendations</h3>';
    html += '<p style="margin-bottom: 1rem; color: #64748B;">Based on your calculation, here are actionable ways to reduce your environmental impact:</p>';
    
    recommendations.forEach((rec, idx) => {
        const priorityClass = rec.priority.toLowerCase();
        
        html += `
            <div class="recommendation-card ${priorityClass}">
                <div class="recommendation-header">
                    <span class="recommendation-type">${rec.type}</span>
                    <span class="recommendation-priority ${priorityClass}">${rec.priority} Priority</span>
                </div>
                <h4>${rec.title}</h4>
                <p class="recommendation-description">${rec.description}</p>
                <div class="recommendation-footer">
                    <div class="recommendation-impact">
                        <strong>Impact:</strong> ${rec.impact}
                    </div>
                    <div class="recommendation-effort">
                        <strong>Effort:</strong> ${rec.effort}
                    </div>
                </div>
            </div>
        `;
    });
    
    recommendationsContainer.innerHTML = html;
}

// ========================================
// DISPLAY RESULTS
// ========================================

function displayResults(results, workloadType, hardware, optimizer, metric, wCost, wSustain, wPerf) {
    const resultsSection = document.getElementById('results-section');
    const resultsInfo = document.getElementById('results-info');
    const topRecommendation = document.getElementById('top-recommendation');
    const resultsBody = document.getElementById('results-body');

    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update info
    resultsInfo.innerHTML = `Report based on <strong>${hardware}</strong> with <strong>${optimizer}</strong> optimization, scoring against <strong>${metric === 'sci' ? 'SCI (gCO2/req)' : 'Total CO2 (kg)'}</strong>.`;

    // Top recommendation
    const top = results[0];
    topRecommendation.innerHTML = `
        <h3>Top Recommendation: ${top.provider} at ${top.location}</h3>
        <ul>
            <li><strong>Total Cost:</strong> $${top.totalCost.toFixed(2)}</li>
            <li><strong>CO2 Emissions:</strong> ${top.co2Kg.toFixed(2)} kg</li>
            <li><strong>Carbon Intensity (SCI):</strong> ${top.sciScore.toFixed(6)} gCO2 per request</li>
            ${workloadType === 'live' ? `<li><strong>Average User Latency:</strong> ${top.avgLatency.toFixed(1)} ms</li>` : '<li><em>(User Latency is not a factor for this training job.)</em></li>'}
        </ul>
        <p style="margin-top: 1rem; font-size: 0.95rem;">
            This option provides the best-balanced trade-off based on your priorities 
            (Cost: ${wCost}%, Sustain: ${wSustain}%${workloadType === 'live' ? `, Perform: ${wPerf}%` : ''})
        </p>
    `;

    // Results table
    resultsBody.innerHTML = results.map((r, idx) => `
        <tr ${idx === 0 ? 'class="highlight"' : ''}>
            <td>${r.provider}</td>
            <td>${r.location}</td>
            <td>$${r.totalCost.toFixed(2)}</td>
            <td>${r.co2Kg.toFixed(2)}</td>
            <td>${r.sciScore.toFixed(6)}</td>
            <td>${r.avgLatency.toFixed(1)}</td>
            <td>${r.overallScore.toFixed(3)}</td>
        </tr>
    `).join('');
    
    // Display sustainability recommendations
    displayRecommendations(results, top, workloadType, hardware);
}

// ========================================
// SPRINT 16: PIPELINE CALCULATION
// ========================================

function runPipelineCalculation() {
    // Get form values for all stages
    const stages = [
        {
            name: 'Data Preparation',
            hardware: document.getElementById('stage1-hardware').value,
            optimizer: 1.0, // No optimizer for data prep
            units: parseInt(document.getElementById('stage1-units').value),
            hours: parseInt(document.getElementById('stage1-hours').value)
        },
        {
            name: 'Training',
            hardware: document.getElementById('stage2-hardware').value,
            optimizer: parseFloat(document.getElementById('stage2-optimizer').value),
            units: parseInt(document.getElementById('stage2-units').value),
            hours: parseInt(document.getElementById('stage2-hours').value)
        },
        {
            name: 'Fine-tuning',
            hardware: document.getElementById('stage3-hardware').value,
            optimizer: parseFloat(document.getElementById('stage3-optimizer').value),
            units: parseInt(document.getElementById('stage3-units').value),
            hours: parseInt(document.getElementById('stage3-hours').value)
        }
    ];
    
    const functionalUnits = parseInt(document.getElementById('pipeline-functional-units').value);
    
    const weightCost = parseInt(document.getElementById('weight-cost').value);
    const weightSustainability = parseInt(document.getElementById('weight-sustainability').value);
    const sustainabilityMetric = document.getElementById('sustainability-metric').value;

    const totalWeight = weightCost + weightSustainability;
    if (totalWeight === 0) {
        alert('Error: Please assign some importance to your strategic priorities.');
        return;
    }

    // Get selected providers
    const selectedProviders = Array.from(document.querySelectorAll('.provider-selection input:checked'))
        .map(cb => cb.value);

    if (selectedProviders.length === 0) {
        alert('Error: Please select at least one cloud provider.');
        return;
    }

    // Calculate results for all provider/region combinations
    const results = [];

    selectedProviders.forEach(provider => {
        const providerData = CLOUD_PROVIDER_DATA[provider];
        
        Object.keys(providerData).forEach(region => {
            const data = providerData[region];
            
            try {
                // Calculate for each stage
                const stageResults = stages.map(stage => {
                    const hardwareInfo = HARDWARE_DATA[stage.hardware];
                    const hardwareTDP = hardwareInfo.TDP_watts;
                    const costPerHour = data.pricing_per_hr[stage.hardware];
                    
                    const effectiveHours = stage.hours * stage.optimizer;
                    const totalRunHours = stage.units * effectiveHours;
                    const itEnergyKwh = (hardwareTDP / 1000) * totalRunHours;
                    const totalEnergyKwh = itEnergyKwh * PUE;
                    const totalCost = costPerHour * totalRunHours;
                    const co2Kg = (totalEnergyKwh * data.carbon_intensity_g) / 1000;
                    
                    return {
                        name: stage.name,
                        hardware: stage.hardware,
                        units: stage.units,
                        hours: stage.hours,
                        energyKwh: totalEnergyKwh,
                        co2Kg: co2Kg,
                        cost: totalCost
                    };
                });
                
                // Sum totals
                const totalEnergy = stageResults.reduce((sum, s) => sum + s.energyKwh, 0);
                const totalCO2 = stageResults.reduce((sum, s) => sum + s.co2Kg, 0);
                const totalCost = stageResults.reduce((sum, s) => sum + s.cost, 0);
                const sciScore = (totalCO2 * 1000) / functionalUnits; // grams per sample
                
                results.push({
                    provider,
                    location: region,
                    stages: stageResults,
                    totalEnergy: totalEnergy,
                    co2Kg: totalCO2,
                    totalCost: totalCost,
                    sciScore: sciScore,
                    avgLatency: 0, // Not applicable for training
                    carbonIntensity: data.carbon_intensity_g
                });
            } catch (error) {
                console.warn(`Skipping ${provider} - ${region}: ${error.message}`);
            }
        });
    });

    // Normalize and score
    if (results.length > 0) {
        const normalize = (arr, key) => {
            const values = arr.map(r => r[key]);
            const min = Math.min(...values);
            const max = Math.max(...values);
            return (max - min) > 0 ? arr.map(r => ({
                ...r,
                [`${key}Score`]: (r[key] - min) / (max - min)
            })) : arr.map(r => ({...r, [`${key}Score`]: 0}));
        };

        let scoredResults = normalize(results, 'totalCost');
        scoredResults = normalize(scoredResults, 'co2Kg');
        scoredResults = normalize(scoredResults, 'sciScore');

        // Calculate overall score (no latency for training)
        const wCost = weightCost / totalWeight;
        const wSustainability = weightSustainability / totalWeight;

        scoredResults.forEach(result => {
            const sustainabilityScore = sustainabilityMetric === 'sci' ? result.sciScoreScore : result.co2KgScore;
            result.overallScore = (
                wCost * result.totalCostScore +
                wSustainability * sustainabilityScore
            );
        });

        // Sort by overall score
        scoredResults.sort((a, b) => a.overallScore - b.overallScore);

        // Display pipeline results
        displayPipelineResults(scoredResults, sustainabilityMetric, weightCost, weightSustainability);
    }
}

function displayPipelineResults(results, metric, wCost, wSustain) {
    const resultsSection = document.getElementById('results-section');
    const resultsInfo = document.getElementById('results-info');
    const topRecommendation = document.getElementById('top-recommendation');
    const resultsBody = document.getElementById('results-body');

    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update info
    resultsInfo.innerHTML = `Report based on <strong>AI Training Pipeline</strong> (3 stages), scoring against <strong>${metric === 'sci' ? 'SCI (gCO2/sample)' : 'Total CO2 (kg)'}</strong>.`;

    // Top recommendation with pipeline breakdown
    const top = results[0];
    const stagesHTML = top.stages.map((stage, idx) => `
        <div class="stage-result">
            <h4>Stage ${idx + 1}: ${stage.name}</h4>
            <div class="stage-metrics">
                <div class="stage-metric">
                    <div class="stage-metric-label">Hardware</div>
                    <div class="stage-metric-value" style="font-size: 0.9rem;">${stage.hardware}</div>
                </div>
                <div class="stage-metric">
                    <div class="stage-metric-label">Units</div>
                    <div class="stage-metric-value">${stage.units}</div>
                </div>
                <div class="stage-metric">
                    <div class="stage-metric-label">Hours</div>
                    <div class="stage-metric-value">${stage.hours}</div>
                </div>
                <div class="stage-metric">
                    <div class="stage-metric-label">Energy</div>
                    <div class="stage-metric-value">${stage.energyKwh.toFixed(2)} kWh</div>
                </div>
                <div class="stage-metric">
                    <div class="stage-metric-label">CO2</div>
                    <div class="stage-metric-value">${stage.co2Kg.toFixed(2)} kg</div>
                </div>
                <div class="stage-metric">
                    <div class="stage-metric-label">Cost</div>
                    <div class="stage-metric-value">$${stage.cost.toFixed(2)}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    topRecommendation.innerHTML = `
        <h3>Top Recommendation: ${top.provider} at ${top.location}</h3>
        <ul>
            <li><strong>Total Cost:</strong> $${top.totalCost.toFixed(2)}</li>
            <li><strong>Total CO2 Emissions:</strong> ${top.co2Kg.toFixed(2)} kg</li>
            <li><strong>Carbon Intensity (SCI):</strong> ${top.sciScore.toFixed(6)} gCO2 per sample</li>
            <li><strong>Total Energy Consumed:</strong> ${top.totalEnergy.toFixed(2)} kWh</li>
        </ul>
        <div class="pipeline-breakdown">
            <h3>Pipeline Stage Breakdown:</h3>
            ${stagesHTML}
        </div>
        <p style="margin-top: 1rem; font-size: 0.95rem;">
            This option provides the best-balanced trade-off for your AI training job based on your priorities 
            (Cost: ${wCost}%, Sustainability: ${wSustain}%)
        </p>
    `;

    // Results table
    resultsBody.innerHTML = results.map((r, idx) => `
        <tr ${idx === 0 ? 'class="highlight"' : ''}>
            <td>${r.provider}</td>
            <td>${r.location}</td>
            <td>$${r.totalCost.toFixed(2)}</td>
            <td>${r.co2Kg.toFixed(2)}</td>
            <td>${r.sciScore.toFixed(6)}</td>
            <td>N/A</td>
            <td>${r.overallScore.toFixed(3)}</td>
        </tr>
    `).join('');
    
    // Display sustainability recommendations for training pipeline
    const topStageHardware = top.stages[1].hardware; // Use stage 2 (training) hardware
    displayRecommendations(results, top, 'training', topStageHardware);
}

// ========================================
// SPRINT 17: FINE-TUNING ADVISOR
// ========================================

function initializeAdvisor() {
    // Toggle advisor content
    const advisorToggle = document.getElementById('advisor-toggle');
    const advisorContent = document.getElementById('advisor-content');
    
    if (advisorToggle && advisorContent) {
        advisorToggle.addEventListener('click', () => {
            if (advisorContent.style.display === 'none') {
                advisorContent.style.display = 'block';
                advisorToggle.classList.add('active');
            } else {
                advisorContent.style.display = 'none';
                advisorToggle.classList.remove('active');
            }
        });
    }

    // Estimate button
    const estimateBtn = document.getElementById('advisor-estimate-btn');
    if (estimateBtn) {
        estimateBtn.addEventListener('click', generateAdvisorEstimate);
    }

    // Apply button
    const applyBtn = document.getElementById('apply-advisor-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyAdvisorToPipeline);
    }
}

function generateAdvisorEstimate() {
    const modelSize = document.getElementById('model-size').value;
    const datasetSize = document.getElementById('dataset-size').value;
    
    const estimate = HEURISTIC_MODEL[modelSize][datasetSize];
    
    // Display results
    const resultsDiv = document.getElementById('advisor-results');
    const recommendationText = document.getElementById('advisor-recommendation-text');
    const detailsList = document.getElementById('advisor-details');
    
    recommendationText.textContent = estimate.recommendation_text;
    
    detailsList.innerHTML = `
        <li><strong>Recommended Hardware:</strong> ${estimate.hw} × ${estimate.num} unit(s)</li>
        <li><strong>Data Preparation:</strong> ${estimate.prep_hours} hours</li>
        <li><strong>Training:</strong> ${estimate.train_hours} hours</li>
        <li><strong>Fine-tuning:</strong> ${estimate.tune_hours} hours</li>
        <li><strong>Total Time:</strong> ${estimate.prep_hours + estimate.train_hours + estimate.tune_hours} hours</li>
        <li><strong>Functional Units:</strong> ${estimate.f_units.toLocaleString()} samples</li>
    `;
    
    resultsDiv.style.display = 'block';
    
    // Store estimate for apply function
    window.currentAdvisorEstimate = estimate;
}

function applyAdvisorToPipeline() {
    if (!window.currentAdvisorEstimate) return;
    
    const estimate = window.currentAdvisorEstimate;
    
    // Switch to training workload
    document.getElementById('workload-type').value = 'training';
    toggleWorkloadForms();
    
    // Apply to pipeline stages
    // Stage 1: Data Preparation (use CPU)
    document.getElementById('stage1-hardware').value = 'AMD EPYC VM (8-vCPU)';
    document.getElementById('stage1-units').value = 1;
    document.getElementById('stage1-hours').value = estimate.prep_hours;
    
    // Stage 2: Training (use recommended hardware)
    document.getElementById('stage2-hardware').value = estimate.hw;
    updateStage2Optimizer();
    document.getElementById('stage2-units').value = estimate.num;
    document.getElementById('stage2-hours').value = estimate.train_hours;
    
    // Stage 3: Fine-tuning (use same hardware)
    document.getElementById('stage3-hardware').value = estimate.hw;
    updateStage3Optimizer();
    document.getElementById('stage3-units').value = estimate.num;
    document.getElementById('stage3-hours').value = estimate.tune_hours;
    
    // Set functional units
    document.getElementById('pipeline-functional-units').value = estimate.f_units;
    
    // Scroll to pipeline
    document.getElementById('pipeline-workload-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Show success message
    alert('Pipeline Builder has been pre-filled with AI recommendations!');
}

// ========================================
// SPRINT 16: WORKLOAD TYPE TOGGLE
// ========================================

function initializeWorkloadToggle() {
    const workloadSelect = document.getElementById('workload-type');
    if (workloadSelect) {
        workloadSelect.addEventListener('change', toggleWorkloadForms);
        toggleWorkloadForms(); // Initialize on load
    }
}

function toggleWorkloadForms() {
    const workloadType = document.getElementById('workload-type').value;
    const simpleForm = document.getElementById('simple-workload-form');
    const pipelineForm = document.getElementById('pipeline-workload-form');
    const userDistSection = document.getElementById('user-distribution-section');
    const performanceWeightGroup = document.getElementById('performance-weight-group');
    
    if (workloadType === 'live') {
        // Show simple form for live applications
        simpleForm.style.display = 'block';
        pipelineForm.style.display = 'none';
        userDistSection.style.display = 'block';
        if (performanceWeightGroup) performanceWeightGroup.style.display = 'block';
    } else {
        // Show pipeline form for training jobs
        simpleForm.style.display = 'none';
        pipelineForm.style.display = 'block';
        userDistSection.style.display = 'none';
        if (performanceWeightGroup) performanceWeightGroup.style.display = 'none';
    }
}

// ========================================
// SPRINT 16: PIPELINE BUILDER
// ========================================

function initializePipelineBuilder() {
    // Update optimizer options when hardware changes
    const stage2Hardware = document.getElementById('stage2-hardware');
    const stage3Hardware = document.getElementById('stage3-hardware');
    
    if (stage2Hardware) {
        stage2Hardware.addEventListener('change', updateStage2Optimizer);
        updateStage2Optimizer();
    }
    
    if (stage3Hardware) {
        stage3Hardware.addEventListener('change', updateStage3Optimizer);
        updateStage3Optimizer();
    }
}

function updateStage2Optimizer() {
    const hardware = document.getElementById('stage2-hardware').value;
    const optimizerSelect = document.getElementById('stage2-optimizer');
    
    const options = HARDWARE_DATA[hardware].Optimizers;
    optimizerSelect.innerHTML = Object.keys(options).map(opt => 
        `<option value="${options[opt]}">${opt}</option>`
    ).join('');
}

function updateStage3Optimizer() {
    const hardware = document.getElementById('stage3-hardware').value;
    const optimizerSelect = document.getElementById('stage3-optimizer');
    
    const options = HARDWARE_DATA[hardware].Optimizers;
    optimizerSelect.innerHTML = Object.keys(options).map(opt => 
        `<option value="${options[opt]}">${opt}</option>`
    ).join('');
}

// ========================================
// HARDWARE MONITOR
// ========================================

const monitorBtn = document.getElementById('run-monitor-btn');
if (monitorBtn) {
    monitorBtn.addEventListener('click', () => {
        const complexity = document.getElementById('task-complexity').value;
        const resultsDiv = document.getElementById('monitor-results');
        
        monitorBtn.textContent = 'Running Task...';
        monitorBtn.disabled = true;

        // Simulate measurement (replace with actual API call)
        setTimeout(() => {
            const co2 = (complexity * 0.8 + Math.random() * 20).toFixed(4);
            const energy = (complexity * 1.2 + Math.random() * 30).toFixed(4);
            const duration = (complexity * 0.5 + Math.random() * 10).toFixed(2);

            document.getElementById('monitor-co2').textContent = `${co2} g`;
            document.getElementById('monitor-energy').textContent = `${energy} Wh`;
            document.getElementById('monitor-duration').textContent = `${duration} sec`;

            resultsDiv.style.display = 'block';
            monitorBtn.textContent = 'Run Live CPU Task & Measure Emissions';
            monitorBtn.disabled = false;
        }, 2000);
    });
}

// ========================================
// CHAT ASSISTANT
// ========================================

function initializeChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    const sendMessage = () => {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addChatMessage(message, 'user');
        chatInput.value = '';

        // Generate AI response
        setTimeout(() => {
            const response = generateResponse(message);
            addChatMessage(response, 'assistant');
        }, 500);
    };

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function addChatMessage(message, type) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar"></div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Search for keywords in knowledge base
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
        if (lowerMessage.includes(key)) {
            return value;
        }
    }
    
    // Default response
    return "I'm sorry, I only have information about the terms used in this tool, such as TDP, PUE, SCI, Carbon Intensity, Triton, OpenVINO, ZenDNN, and Latency. Could you please ask about one of these topics?";
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

console.log('%cGreenMind Calculator', 'color: #003781; font-size: 20px; font-weight: bold;');
console.log('%cBalancing Sustainability, Performance, and Cost', 'color: #5A8FCD; font-size: 12px;');
