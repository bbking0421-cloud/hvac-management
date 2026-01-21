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
                <div><span class="cursor">█</span>
