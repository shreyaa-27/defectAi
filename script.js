const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const detectBtn = document.getElementById('detectBtn');
const resultText = document.getElementById('resultText');
const resultBox = document.getElementById('resultBox');
const fileLabel = document.getElementById('fileLabel');
const fileName = document.getElementById('fileName');

imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;

    // Show file name
    fileName.textContent = `Selected: ${file.name}`;
    fileName.style.display = "block";
    fileLabel.textContent = "✅ Image Selected - Click to Change";
    fileLabel.style.background = "#dcfce7";
    fileLabel.style.borderColor = "#22c55e";
    fileLabel.style.color = "#16a34a";

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        previewImage.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Show result box
    resultBox.style.display = "block";
    resultText.innerHTML = '<span style="color: #22c55e;">✓ Image uploaded successfully!</span><br><small>Click "Detect Defect" to analyze.</small>';
    
    // Enable button
    detectBtn.disabled = false;
    detectBtn.style.opacity = "1";
    detectBtn.style.cursor = "pointer";
});

detectBtn.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) {
        resultBox.style.display = "block";
        resultText.innerHTML = '<span style="color: #ef4444;">⚠ Please upload an image first.</span>';
        return;
    }

    // Show loading state
    detectBtn.disabled = true;
    detectBtn.textContent = "⏳ Analyzing...";
    detectBtn.classList.add("loading");
    
    resultBox.style.display = "block";
    resultText.innerHTML = '<span style="color: #667eea;">🔍 Analyzing image... Please wait.</span>';

    const formData = new FormData();
    formData.append("image", file);

    const API_URL = 'http://127.0.0.1:5000';
    
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();

        if (data.error) {
            resultText.innerHTML = `<span style="color: #ef4444;">❌ Error: ${data.error}</span>`;
            detectBtn.disabled = false;
            detectBtn.textContent = "🔬 Detect Defect";
            detectBtn.classList.remove("loading");
            return;
        }

        // Format result with better styling
        const confidenceColor = parseFloat(data.confidence.replace('%', '')) > 80 ? '#22c55e' : 
                               parseFloat(data.confidence.replace('%', '')) > 60 ? '#f59e0b' : '#ef4444';
        
        let resultHTML = `<div style="margin-bottom: 15px;">
            <strong style="color: #667eea; font-size: 1.3em;">Defect Type: ${data.defect}</strong><br>
            <span style="color: ${confidenceColor}; font-size: 1.1em; font-weight: 600;">Confidence: ${data.confidence}</span>
        </div>`;
        
        if (data.all_predictions) {
            resultHTML += '<div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e2e8f0;"><small style="color: #718096; font-weight: 600; display: block; margin-bottom: 10px;">📈 All Predictions:</small>';
            Object.entries(data.all_predictions)
                .sort((a, b) => b[1] - a[1])
                .forEach(([name, prob], index) => {
                    const probPercent = (prob * 100).toFixed(2);
                    const isTop = index === 0;
                    const barWidth = probPercent;
                    const barColor = isTop ? '#667eea' : '#cbd5e0';
                    resultHTML += `
                        <div style="margin: 8px 0; padding: 8px; background: ${isTop ? '#f0f4ff' : '#f7fafc'}; border-radius: 8px; border-left: ${isTop ? '4px solid #667eea' : '2px solid #e2e8f0'};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="color: ${isTop ? '#667eea' : '#4a5568'}; font-weight: ${isTop ? '600' : '400'};">
                                    ${isTop ? '🏆 ' : ''}${name}
                                </span>
                                <span style="color: ${isTop ? '#667eea' : '#718096'}; font-weight: ${isTop ? '600' : '400'};">
                                    ${probPercent}%
                                </span>
                            </div>
                            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${barWidth}%; height: 100%; background: ${barColor}; transition: width 0.3s ease; border-radius: 3px;"></div>
                            </div>
                        </div>
                    `;
                });
            resultHTML += '</div>';
        }
        
        resultText.innerHTML = resultHTML;

    } catch (error) {
        console.error(error);
        resultText.innerHTML = '<span style="color: #ef4444;">❌ Error connecting to server. Make sure Flask is running on http://127.0.0.1:5000</span>';
    } finally {
        // Reset button
        detectBtn.disabled = false;
        detectBtn.textContent = "🔬 Detect Defect";
        detectBtn.classList.remove("loading");
    }
});

// Initialize - hide result box initially
resultBox.style.display = "none";
detectBtn.disabled = true;
detectBtn.style.opacity = "0.6";
detectBtn.style.cursor = "not-allowed";
