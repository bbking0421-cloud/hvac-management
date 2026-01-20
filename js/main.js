// API 기본 URL
const API_BASE = 'tables';

// 페이지 로드 시 통계 데이터 가져오기
document.addEventListener('DOMContentLoaded', async function() {
    await loadStatistics();
});

// 통계 데이터 로드
async function loadStatistics() {
    try {
        // 현장 수
        const sitesResponse = await fetch(`${API_BASE}/sites?limit=1000`);
        const sitesData = await sitesResponse.json();
        document.getElementById('totalSites').textContent = sitesData.total || 0;

        // 장비 수
        const equipmentResponse = await fetch(`${API_BASE}/equipment?limit=1000`);
        const equipmentData = await equipmentResponse.json();
        document.getElementById('totalEquipment').textContent = equipmentData.total || 0;

        // 금일 점검 수
        const inspectionsResponse = await fetch(`${API_BASE}/inspections?limit=1000`);
        const inspectionsData = await inspectionsResponse.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayCount = inspectionsData.data.filter(inspection => {
            const inspectionDate = new Date(inspection.inspection_date).toISOString().split('T')[0];
            return inspectionDate === today;
        }).length;
        
        document.getElementById('todayInspections').textContent = todayCount;
    } catch (error) {
        console.error('통계 데이터 로드 오류:', error);
    }
}

// QR 스캐너 열기
function openQRScanner() {
    alert('QR 스캐너 기능은 곧 제공될 예정입니다.\n현재는 "장비 목록"에서 장비를 선택해주세요.');
    location.href = 'equipment-list.html';
}

// 유틸리티 함수: 날짜 포맷
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 유틸리티 함수: 상태 뱃지 색상
function getStatusColor(status) {
    const colors = {
        '정상': '#4CAF50',
        '주의': '#FF9800',
        '경고': '#F44336',
        '고장': '#9E9E9E'
    };
    return colors[status] || '#2196F3';
}

// 유틸리티 함수: 장비 종류 아이콘
function getEquipmentIcon(type) {
    const icons = {
        'AHU(공조기)': 'fa-wind',
        'FCU(팬코일유닛)': 'fa-fan',
        '냉동기': 'fa-snowflake',
        '냉각탑': 'fa-building',
        '보일러': 'fa-fire',
        '펌프': 'fa-water',
        '송풍기': 'fa-wind',
        '배기팬': 'fa-fan',
        '기타': 'fa-cog'
    };
    return icons[type] || 'fa-cog';
}
