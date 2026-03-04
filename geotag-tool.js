/**
 * GEOTAG TOOL WITH MULTI-IMAGE AND BULK DESCRIPTION SUPPORT
 * Extends existing functionality - Add this to your existing geotag-tool.js
 */

// Store multiple images data
let uploadedFiles = [];
let currentFileIndex = 0;
let processedImages = [];

// Bulk description element
const bulkDescription = document.getElementById('bulkDescription');
const descriptionCounter = document.getElementById('descriptionCounter');

// Update file input to accept multiple files
document.getElementById('fileInput').multiple = true;

// Add description counter
if (bulkDescription && descriptionCounter) {
    bulkDescription.addEventListener('input', function() {
        const count = this.value.length;
        descriptionCounter.textContent = count;
    });
}

// Override/Extend the file upload handler
const originalFileInputHandler = document.getElementById('fileInput').onchange;
document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files).filter(file => 
        file.type === 'image/jpeg' || file.type === 'image/jpg'
    );
    
    if (files.length > 0) {
        uploadedFiles = files;
        currentFileIndex = 0;
        processedImages = [];
        
        // Update UI to show multiple files
        updateMultipleFilesUI();
        
        // Load first image for preview
        loadImageForPreview(files[0]);
        
        // Enable process button
        document.getElementById('processBtn').disabled = false;
        
        // Show file info section
        document.getElementById('file-info-section').classList.remove('hidden');
        document.getElementById('coordinates-section').classList.remove('hidden');
        
        // Update step indicators
        document.getElementById('step-1').classList.add('active');
        document.getElementById('step-2').classList.add('active');
        
        // Update status
        updateStatus(`Loaded ${files.length} image(s). Viewing image 1 of ${files.length}`, 'info');
    }
});

// Override/Extend drop zone handler
const dropZone = document.getElementById('dropZone');
if (dropZone) {
    // Store original drop handler if needed
    const originalDropHandler = dropZone.ondrop;
    
    dropZone.ondrop = function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type === 'image/jpeg' || file.type === 'image/jpg'
        );
        
        if (files.length > 0) {
            uploadedFiles = files;
            currentFileIndex = 0;
            processedImages = [];
            
            updateMultipleFilesUI();
            loadImageForPreview(files[0]);
            
            // Enable process button
            document.getElementById('processBtn').disabled = false;
            
            // Show file info section
            document.getElementById('file-info-section').classList.remove('hidden');
            document.getElementById('coordinates-section').classList.remove('hidden');
            
            // Update step indicators
            document.getElementById('step-1').classList.add('active');
            document.getElementById('step-2').classList.add('active');
            
            updateStatus(`Loaded ${files.length} image(s). Viewing image 1 of ${files.length}`, 'info');
        } else {
            showNotification('Please drop valid JPEG images only', 'error');
        }
    };
}

// New function to update UI showing multiple files
function updateMultipleFilesUI() {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    // Check if multiple files indicator exists, if not create it
    let multipleIndicator = document.getElementById('multiple-files-indicator');
    if (!multipleIndicator) {
        multipleIndicator = document.createElement('div');
        multipleIndicator.id = 'multiple-files-indicator';
        multipleIndicator.className = 'mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200';
        
        const uploadSection = document.getElementById('upload-section');
        uploadSection.appendChild(multipleIndicator);
    }
    
    // Update indicator content
    multipleIndicator.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <i class="fas fa-images text-indigo-600"></i>
                </div>
                <div>
                    <div class="font-medium text-indigo-900">${uploadedFiles.length} Image${uploadedFiles.length > 1 ? 's' : ''} Selected</div>
                    <div class="text-sm text-indigo-700">Viewing image ${currentFileIndex + 1} of ${uploadedFiles.length}</div>
                </div>
            </div>
            <div class="flex gap-2">
                <button id="prevImageBtn" class="px-3 py-2 bg-white rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-colors ${currentFileIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentFileIndex === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button id="nextImageBtn" class="px-3 py-2 bg-white rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-colors ${currentFileIndex === uploadedFiles.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentFileIndex === uploadedFiles.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        <div class="mt-3 text-sm text-indigo-700">
            <i class="fas fa-info-circle mr-1"></i>
            All images will be processed with the same GPS coordinates and bulk description
        </div>
    `;
    
    // Add event listeners for navigation buttons
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');
    
    if (prevBtn && !prevBtn.disabled) {
        prevBtn.addEventListener('click', () => navigateImages(-1));
    }
    if (nextBtn && !nextBtn.disabled) {
        nextBtn.addEventListener('click', () => navigateImages(1));
    }
}

// Navigate between images
function navigateImages(direction) {
    const newIndex = currentFileIndex + direction;
    if (newIndex >= 0 && newIndex < uploadedFiles.length) {
        currentFileIndex = newIndex;
        loadImageForPreview(uploadedFiles[currentFileIndex]);
        updateMultipleFilesUI();
        updateStatus(`Viewing image ${currentFileIndex + 1} of ${uploadedFiles.length}`, 'info');
    }
}

// Load image for preview
function loadImageForPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('previewImage');
        preview.src = e.target.result;
        
        // Extract existing GPS data
        extractGPSData(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Extract GPS data from image
function extractGPSData(imageData) {
    try {
        const exifObj = piexif.load(imageData);
        const gps = exifObj.GPS;
        
        if (gps && gps[piexif.GPSIFD.GPSLatitude] && gps[piexif.GPSIFD.GPSLongitude]) {
            const lat = convertDMSToDD(gps[piexif.GPSIFD.GPSLatitude], gps[piexif.GPSIFD.GPSLatitudeRef]);
            const lon = convertDMSToDD(gps[piexif.GPSIFD.GPSLongitude], gps[piexif.GPSIFD.GPSLongitudeRef]);
            
            document.getElementById('current-lat').textContent = lat.toFixed(6);
            document.getElementById('current-lon').textContent = lon.toFixed(6);
            
            // Update input fields
            document.getElementById('lat').value = lat.toFixed(6);
            document.getElementById('lon').value = lon.toFixed(6);
            
            // Update map if exists
            if (window.map) {
                window.map.setView([lat, lon], 13);
                if (window.marker) {
                    window.marker.setLatLng([lat, lon]);
                }
            }
        } else {
            document.getElementById('current-lat').textContent = 'No GPS data found';
            document.getElementById('current-lon').textContent = 'No GPS data found';
        }
    } catch (error) {
        console.error('Error extracting GPS data:', error);
    }
}

// Convert DMS to Decimal Degrees
function convertDMSToDD(dmsArray, ref) {
    const degrees = dmsArray[0][0] / dmsArray[0][1];
    const minutes = dmsArray[1][0] / dmsArray[1][1];
    const seconds = dmsArray[2][0] / dmsArray[2][1];
    
    let dd = degrees + (minutes / 60) + (seconds / 3600);
    
    if (ref === 'S' || ref === 'W') {
        dd = -dd;
    }
    
    return dd;
}

// Convert Decimal Degrees to DMS
function convertDDToDMS(deg, ref) {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60 * 100) / 100;
    
    return [[[degrees, 1]], [[minutes, 1]], [[seconds * 100, 100]]];
}

// Override/Extend the process button handler
const processBtn = document.getElementById('processBtn');
const originalProcessHandler = processBtn.onclick;

processBtn.addEventListener('click', async function() {
    if (!uploadedFiles || uploadedFiles.length === 0) {
        showNotification('Please upload images first', 'error');
        return;
    }
    
    const lat = parseFloat(document.getElementById('lat').value);
    const lon = parseFloat(document.getElementById('lon').value);
    const description = bulkDescription ? bulkDescription.value.trim() : '';
    
    if (isNaN(lat) || isNaN(lon)) {
        showNotification('Please enter valid coordinates', 'error');
        return;
    }
    
    // Show processing state
    const spinner = document.getElementById('processingSpinner');
    const processText = document.getElementById('processText');
    spinner.classList.remove('hidden');
    processText.textContent = `Processing ${uploadedFiles.length} image(s)...`;
    processBtn.disabled = true;
    
    try {
        processedImages = [];
        
        // Process all images
        for (let i = 0; i < uploadedFiles.length; i++) {
            updateStatus(`Processing image ${i + 1} of ${uploadedFiles.length}...`, 'info');
            
            const file = uploadedFiles[i];
            const processedImage = await processSingleImage(file, lat, lon, description);
            processedImages.push(processedImage);
        }
        
        // Show filename modal for first image or download all
        if (processedImages.length === 1) {
            // Single image - show filename modal
            showFilenameModal(processedImages[0]);
        } else {
            // Multiple images - download as zip or individually
            if (processedImages.length <= 5) {
                // Download individually for small batches
                for (let i = 0; i < processedImages.length; i++) {
                    const fileName = `geotag_${i + 1}_${uploadedFiles[i].name}`;
                    downloadImage(processedImages[i], fileName);
                }
                updateStatus(`Successfully downloaded ${processedImages.length} images!`, 'success');
                showNotification(`Downloaded ${processedImages.length} images`, 'success');
            } else {
                // For larger batches, suggest using the individual downloads
                showNotification(`${processedImages.length} images processed. Each will download separately.`, 'info');
                for (let i = 0; i < processedImages.length; i++) {
                    const fileName = `geotag_${i + 1}_${uploadedFiles[i].name}`;
                    downloadImage(processedImages[i], fileName);
                }
            }
        }
    } catch (error) {
        console.error('Error processing images:', error);
        updateStatus('Error processing images. Please try again.', 'error');
        showNotification('Error processing images', 'error');
    } finally {
        // Reset processing state
        spinner.classList.add('hidden');
        processText.textContent = 'Process Images & Download';
        processBtn.disabled = false;
    }
});

// Process single image
function processSingleImage(file, lat, lon, description) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const imageData = e.target.result;
                let exifObj;
                
                try {
                    exifObj = piexif.load(imageData);
                } catch {
                    exifObj = { "0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {} };
                }
                
                // Set GPS data
                const latRef = lat >= 0 ? 'N' : 'S';
                const lonRef = lon >= 0 ? 'E' : 'W';
                
                exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = latRef;
                exifObj.GPS[piexif.GPSIFD.GPSLatitude] = convertDDToDMS(lat, latRef);
                exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
                exifObj.GPS[piexif.GPSIFD.GPSLongitude] = convertDDToDMS(lon, lonRef);
                exifObj.GPS[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];
                
                // Add description if provided
                if (description) {
                    exifObj["0th"][piexif.ImageIFD.ImageDescription] = description;
                }
                
                const exifBytes = piexif.dump(exifObj);
                const newImageData = piexif.insert(exifBytes, imageData);
                
                resolve(newImageData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Download image
function downloadImage(imageData, fileName) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show filename modal (reuse existing modal)
function showFilenameModal(imageData) {
    const modal = document.getElementById('filenameModal');
    const input = document.getElementById('filenameInput');
    const suggested = document.getElementById('suggestedFilename');
    
    // Set suggested filename
    const baseName = uploadedFiles && uploadedFiles[0] ? 
        uploadedFiles[0].name.replace('.jpg', '_geotag.jpg').replace('.jpeg', '_geotag.jpeg') : 
        'geotag_edited_image.jpg';
    suggested.textContent = baseName;
    input.value = baseName;
    
    // Store image data for confirm handler
    modal.dataset.imageData = imageData;
    
    // Show modal
    modal.classList.add('show');
}

// Update status message
function updateStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status-message ${type}`;
    statusDiv.innerHTML = `
        <div class="flex items-center justify-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    const iconEl = document.getElementById('notification-icon');
    
    messageEl.textContent = message;
    
    if (type === 'success') {
        iconEl.className = 'w-6 h-6 rounded-full bg-green-100 flex items-center justify-center';
        iconEl.innerHTML = '<i class="fas fa-check text-green-600 text-xs"></i>';
    } else if (type === 'error') {
        iconEl.className = 'w-6 h-6 rounded-full bg-red-100 flex items-center justify-center';
        iconEl.innerHTML = '<i class="fas fa-times text-red-600 text-xs"></i>';
    } else {
        iconEl.className = 'w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center';
        iconEl.innerHTML = '<i class="fas fa-info text-blue-600 text-xs"></i>';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Modal confirm handler
const modalConfirm = document.getElementById('modalConfirm');
if (modalConfirm) {
    modalConfirm.addEventListener('click', function() {
        const modal = document.getElementById('filenameModal');
        const input = document.getElementById('filenameInput');
        let fileName = input.value.trim();
        
        if (!fileName) {
            fileName = document.getElementById('suggestedFilename').textContent;
        }
        
        if (!fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
            fileName += '.jpg';
        }
        
        const imageData = modal.dataset.imageData;
        downloadImage(imageData, fileName);
        
        modal.classList.remove('show');
        updateStatus('Image downloaded successfully!', 'success');
        showNotification('Image saved successfully', 'success');
    });
}

// Modal cancel handler
const modalCancel = document.getElementById('modalCancel');
if (modalCancel) {
    modalCancel.addEventListener('click', function() {
        document.getElementById('filenameModal').classList.remove('show');
    });
}

// Modal close handler
const modalClose = document.getElementById('modalClose');
if (modalClose) {
    modalClose.addEventListener('click', function() {
        document.getElementById('filenameModal').classList.remove('show');
    });
}

// Change file button
const changeFileBtn = document.getElementById('change-file');
if (changeFileBtn) {
    changeFileBtn.addEventListener('click', function() {
        uploadedFiles = [];
        currentFileIndex = 0;
        processedImages = [];
        
        // Hide sections
        document.getElementById('file-info-section').classList.add('hidden');
        document.getElementById('coordinates-section').classList.add('hidden');
        
        // Reset step indicators
        document.getElementById('step-1').classList.add('active');
        document.getElementById('step-2').classList.remove('active');
        
        // Reset process button
        document.getElementById('processBtn').disabled = true;
        
        // Remove multiple files indicator
        const indicator = document.getElementById('multiple-files-indicator');
        if (indicator) indicator.remove();
        
        // Reset preview
        document.getElementById('previewImage').src = '';
        
        // Clear GPS display
        document.getElementById('current-lat').textContent = 'No GPS data found';
        document.getElementById('current-lon').textContent = 'No GPS data found';
        
        // Reset input fields
        document.getElementById('lat').value = '';
        document.getElementById('lon').value = '';
        
        // Update status
        updateStatus('Upload a JPEG image to begin editing GPS data', 'info');
    });
}

// Auto-fill from image button
const autoFillBtn = document.getElementById('auto-fill');
if (autoFillBtn) {
    autoFillBtn.addEventListener('click', function() {
        if (uploadedFiles && uploadedFiles[currentFileIndex]) {
            loadImageForPreview(uploadedFiles[currentFileIndex]);
            showNotification('GPS data extracted from image', 'success');
        }
    });
}