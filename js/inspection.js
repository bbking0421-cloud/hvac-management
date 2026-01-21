// 전역 변수
let currentStep = 1;
let selectedSite = null;
let selectedBuilding = null;
let selectedEquipment = null;
let allEquipment = [];
let selectedPhotos = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadSites();
    
    // 폼 제출 이벤트
    const form = document.getElementById('inspectionFormData');
    if (form) {
        form.addEventListener('submit', submitInspection);
    }
    
    // 사진 입력 이벤트
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelect);
    }
});

// Step 1: 현장 목록 로드
async function loadSites() {
    try {
        const response = await fetch(`${API_BASE}?action=list&table=sites`);
        const data = await response.json();
        
        const siteList = document.getElementById('siteList');
        siteList.innerHTML = '';
        
        if (!data.data || data.data.length === 0) {
            siteList.innerHTML = '<p style="text-align: center; color: #999;">등록된 현장이 없습니다.</p>';
            return;
        }
        
        data.data.forEach(site => {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.onclick = () => selectSite(site);
            card.innerHTML = `
                <div class="icon"><i class="fas fa-building"></i></div>
                <h3>${site.site_name}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${site.address}</p>
                <p><i class="fas fa-user"></i> ${site.manager}</p>
                <p><i class="fas fa-phone"></i> ${site.phone}</p>
            `;
            siteList.appendChild(card);
        });
    } catch (error) {
        console.error('현장 목록 로드 오류:', error);
        alert('현장 목록을 불러오는데 실패했습니다.');
    }
}

// Step 2: 건물 목록 로드
async function selectSite(site) {
    selectedSite = site;
    document.getElementById('selectedSiteName').textContent = site.site_name;
    
    try {
        const response = await fetch(`${API_BASE}?action=list&table=buildings`);
        const data = await response.json();
        
        const buildings = data.data.filter(b => b.site_id === site.id);
        
        const buildingList = document.getElementById('buildingList');
        buildingList.innerHTML = '';
        
        if (buildings.length === 0) {
            buildingList.innerHTML = '<p style="text-align: center; color: #999;">등록된 건물이 없습니다.</p>';
            return;
        }
        
        buildings.forEach(building => {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.onclick = () => selectBuilding(building);
            card.innerHTML = `
                <div class="icon"><i class="fas fa-building"></i></div>
                <h3>${building.building_name}</h3>
                <p><i class="fas fa-layer-group"></i> ${building.floors}층</p>
                <p><i class="fas fa-expand"></i> ${building.area}㎡</p>
            `;
            buildingList.appendChild(card);
        });
        
        changeStep(2);
    } catch (error) {
        console.error('건물 목록 로드 오류:', error);
        alert('건물 목록을 불러오는데 실패했습니다.');
    }
}

// Step 3: 장비 목록 로드
async function selectBuilding(building) {
    selectedBuilding = building;
    document.getElementById('selectedSiteName2').textContent = selectedSite.site_name;
    document.getElementById('selectedBuildingName').textContent = building.building_name;
    
    try {
        const response = await fetch(`${API_BASE}?action=list&table=equipment`);
        const data = await response.json();
        
        allEquipment = data.data.filter(e => e.building_id === building.id);
        
        const floors = [...new Set(allEquipment.map(e => e.floor))];
        const types = [...new Set(allEquipment.map(e => e.equipment_type))];
        
        const floorFilter = document.getElementById('floorFilter');
        floorFilter.innerHTML = '<option value="">전체</option>';
        floors.forEach(floor => {
            floorFilter.innerHTML += `<option value="${floor}">${floor}</option>`;
        });
        
        const typeFilter = document.getElementById('typeFilter');
        typeFilter.innerHTML = '<option value="">전체</option>';
        types.forEach(type => {
            typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
        });
        
        floorFilter.onchange = filterEquipment;
        typeFilter.onchange = filterEquipment;
        
        displayEquipment(allEquipment);
        changeStep(3);
    } catch (error) {
        console.error('장비 목록 로드 오류:', error);
        alert('장비 목록을 불러오는데 실패했습니다.');
    }
}

function filterEquipment() {
    const floorValue = document.getElementById('floorFilter').value;
    const typeValue = document.getElementById('typeFilter').value;
    
    let filtered = allEquipment;
    
    if (floorValue) {
        filtered = filtered.filter(e => e.floor === floorValue);
    }
    
    if (typeValue) {
        filtered = filtered.filter(e => e.equipment_type === typeValue);
    }
    
    displayEquipment(filtered);
}

function displayEquipment(equipment) {
    const equipmentList = document.getElementById('equipmentList');
    equipmentList.innerHTML = '';
    
    if (equipment.length === 0) {
        equipmentList.innerHTML = '<p style="text-align: center; color: #999;">조건에 맞는 장비가 없습니다.</p>';
        return;
    }
    
    equipment.forEach(eq => {
        const card = document.createElement('div');
        card.className = 'equipment-card';
        card.onclick = () => selectEquipment(eq);
        card.innerHTML = `
            <div class="equipment-icon"><i class="fas ${getEquipmentIcon(eq.equipment_type)}"></i></div>
            <div class="equipment-type">${eq.equipment_type}</div>
            <div class="equipment-info">
                <div><i class="fas fa-tag"></i> ${eq.id}</div>
                <div><i class="fas fa-layer-group"></i> ${eq.floor}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${eq.location}</div>
                <div><i class="fas fa-box"></i> ${eq.model}</div>
            </div>
        `;
        equipmentList.appendChild(card);
    });
}

// Step 4: 점검 폼 표시
function selectEquipment(equipment) {
    selectedEquipment = equipment;
    
    const detailDiv = document.getElementById('equipmentDetail');
    detailDiv.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <i class="fas fa-wrench"></i>
                <div>
                    <div class="detail-label">장비 종류</div>
                    <div class="detail-value">${equipment.equipment_type}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-tag"></i>
                <div>
                    <div class="detail-label">장비 ID</div>
                    <div class="detail-value">${equipment.id}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-layer-group"></i>
                <div>
                    <div class="detail-label">위치</div>
                    <div class="detail-value">${equipment.floor} - ${equipment.location}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-box"></i>
                <div>
                    <div class="detail-label">모델</div>
                    <div class="detail-value">${equipment.model}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-tachometer-alt"></i>
                <div>
                    <div class="detail-label">용량</div>
                    <div class="detail-value">${equipment.capacity}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <div>
                    <div class="detail-label">설치일</div>
                    <div class="detail-value">${equipment.install_date}</div>
                </div>
            </div>
        </div>
    `;
    
    changeStep(4);
}

function updateFormFields() {
    const inspectionType = document.querySelector('input[name="inspectionType"]:checked').value;
    const detailedFields = document.getElementById('detailedFields');
    
    if (inspectionType === '세부점검') {
        detailedFields.style.display = 'block';
    } else {
        detailedFields.style.display = 'none';
    }
}

// 점검 데이터 제출
async function submitInspection(e) {
    e.preventDefault();
    
    const inspectionType = document.querySelector('input[name="inspectionType"]:checked').value;
    const inspectorName = document.getElementById('inspectorName').value;
    const status = document.getElementById('status').value;
    
    if (!inspectorName || !status) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    // 사진 알림
    if (selectedPhotos.length > 0) {
        alert('사진 업로드 기능은 현재 개발 중입니다.\n사진 없이 점검 데이터만 저장됩니다.');
    }
    
    // 점검 데이터 구성
    const inspectionData = {
        equipment_id: selectedEquipment.id,
        inspection_type: inspectionType,
        inspector_name: inspectorName,
        inspection_date: new Date().toISOString(),
        status: status,
        temperature: document.getElementById('temperature').value || '',
        pressure: document.getElementById('pressure').value || '',
        operation_status: document.getElementById('operationStatus').value,
        leak_check: document.getElementById('leakCheck').value,
        notes: document.getElementById('notes').value || '',
        photo_url: ''
    };
    
    if (inspectionType === '세부점검') {
        inspectionData.vibration = document.getElementById('vibration').value || '';
        inspectionData.noise = document.getElementById('noise').value || '';
        inspectionData.clean_status = document.getElementById('cleanStatus').value;
        inspectionData.filter_status = document.getElementById('filterStatus').value;
    }
    
    try {
        // GET 방식으로 전송
        const params = new URLSearchParams();
        params.append('action', 'create');
        params.append('table', 'inspections');
        
        Object.keys(inspectionData).forEach(key => {
            params.append(key, inspectionData[key]);
        });
        
        // Google Apps Script로 전송
        const url = `${API_BASE}?${params.toString()}`;
        
        // 숨겨진 iframe으로 전송
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hidden_iframe';
        document.body.appendChild(iframe);
        
        iframe.onload = function() {
            setTimeout(() => {
                document.body.removeChild(iframe);
                alert('점검이 성공적으로 저장되었습니다!');
                selectedPhotos = [];
                location.href = 'index.html';
            }, 1000);
        };
        
        iframe.src = url;
        
    } catch (error) {
        console.error('점검 저장 오류:', error);
        alert('점검 저장에 실패했습니다.');
    }
}

function changeStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.selection-panel').forEach(p => p.classList.remove('active'));
    
    document.getElementById('step' + step).classList.add('active');
    currentStep = step;
    
    switch(step) {
        case 1:
            document.getElementById('siteSelection').classList.add('active');
            break;
        case 2:
            document.getElementById('buildingSelection').classList.add('active');
            break;
        case 3:
            document.getElementById('equipmentSelection').classList.add('active');
            break;
        case 4:
            document.getElementById('inspectionForm').classList.add('active');
            break;
    }
    
    window.scrollTo(0, 0);
}

// 사진 선택 처리
function handlePhotoSelect(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedPhotos.push({
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name
                });
                updatePhotoPreview();
            };
            reader.readAsDataURL(file);
        }
    });
    
    event.target.value = '';
}

function updatePhotoPreview() {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    
    selectedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.dataUrl}" alt="사진 ${index + 1}">
            <button class="remove-photo" onclick="removePhoto(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        preview.appendChild(photoItem);
    });
}

function removePhoto(index) {
    selectedPhotos.splice(index, 1);
    updatePhotoPreview();
}
