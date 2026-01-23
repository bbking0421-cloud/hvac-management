// API 기본 URL
const API_BASE = 'https://script.google.com/macros/s/AKfycbzKnOxwx-AY4fg_bT88wHfR6w3BIbAytWnl8wrQ_MdSRj39LSYRYueDgx8Hl-RC1Jybuw/exec';

// 비밀번호 설정
const PASSWORDS = {
    inspector: '1234',  // 점검자 비밀번호
    manager: 'admin123' // 관리자 비밀번호
};

// 현재 접근 시도 중인 역할
let currentRole = null;

// 페이지 로드 시 통계 데이터 가져오기
document.addEventListener('DOMContentLoaded', async function() {
    await loadStatistics();
    
    // 비밀번호 입력 시 엔터키 처리
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitPassword();
            }
        });
    }
});

// 통계 데이터 로드
async function loadStatistics() {
    // index.html에만 있는 요소들 확인
    const totalSitesElement = document.getElementById('totalSites');
    if (!totalSitesElement) return; // index.html이 아니면 종료
    
    try {
        // 현장 수
        const sitesResponse = await fetch(`${API_BASE}?action=list&table=sites`);
        const sitesData = await sitesResponse.json();
        document.getElementById('totalSites').textContent = sitesData.total || 0;

        // 장비 수
        const equipmentResponse = await fetch(`${API_BASE}?action=list&table=equipment`);
        const equipmentData = await equipmentResponse.json();
        document.getElementById('totalEquipment').textContent = equipmentData.total || 0;

        // 금일 점검 수
        const inspectionsResponse = await fetch(`${API_BASE}?action=list&table=inspections`);
        const inspectionsData = await inspectionsResponse.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayCount = inspectionsData.data.filter(inspection => {
            const inspectionDate = new Date(inspection.inspection_date).toISOString().split('T')[0];
            return inspectionDate === today;
        }).length;
        
        document.getElementById('todayInspections').textContent = todayCount;
    } catch (error) {
        console.error('통계 로드 오류:', error);
        // 오류 시 기본값 0으로 설정
        document.getElementById('totalSites').textContent = '0';
        document.getElementById('totalEquipment').textContent = '0';
        document.getElementById('todayInspections').textContent = '0';
    }
}

// QR 스캐너 열기
function openQRScanner() {
    alert('🔍 QR 코드 스캔 기능은 준비 중입니다!\n장비 목록 페이지로 이동합니다.');
    location.href = 'equipment-list.html';
}

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 상태에 따른 색상 반환
function getStatusColor(status) {
    const colors = {
        '정상': '#10b981',
        '주의': '#f59e0b',
        '경고': '#ef4444',
        '고장': '#dc2626'
    };
    return colors[status] || '#6b7280';
}

// 장비 종류에 따른 아이콘 반환
function getEquipmentIcon(type) {
    const icons = {
        'AHU(공조기)': 'fa-wind',
        'FCU(팬코일유닛)': 'fa-fan',
        '냉동기': 'fa-snowflake',
        '냉각탑': 'fa-building',
        '보일러': 'fa-fire',
        '펌프': 'fa-water',
        '송풍기': 'fa-wind',
        '배기팬': 'fa-fan'
    };
    return icons[type] || 'fa-cog';
}

// ===== 비밀번호 인증 시스템 =====

// 비밀번호 확인 팝업 열기
function checkPassword(role) {
    currentRole = role;
    const modal = document.getElementById('passwordModal');
    const title = document.getElementById('modalTitle');
    const description = document.getElementById('modalDescription');
    
    if (role === 'inspector') {
        title.textContent = '🔒 점검자 인증';
        description.textContent = '장비 점검을 위해 비밀번호를 입력하세요';
    } else {
        title.textContent = '🔒 관리자 인증';
        description.textContent = '관리 대시보드 접근을 위해 비밀번호를 입력하세요';
    }
    
    modal.style.display = 'flex';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
    document.getElementById('passwordError').style.display = 'none';
}

// 비밀번호 팝업 닫기
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    currentRole = null;
}

// 비밀번호 제출
function submitPassword() {
    const input = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('passwordError');
    
    if (!currentRole) return;
    
    // 비밀번호 확인
    if (input === PASSWORDS[currentRole]) {
        // 인증 성공
        closePasswordModal();
        
        // 해당 페이지로 이동
        if (currentRole === 'inspector') {
            location.href = 'inspection.html';
        } else {
            location.href = 'dashboard.html';
        }
    } else {
        // 인증 실패
        errorDiv.style.display = 'block';
        errorDiv.textContent = '❌ 비밀번호가 올바르지 않습니다';
        
        // 입력 필드 흔들기 효과
        const inputField = document.getElementById('passwordInput');
        inputField.classList.add('shake');
        setTimeout(() => {
            inputField.classList.remove('shake');
        }, 500);
        
        // 입력 필드 초기화
        inputField.value = '';
        inputField.focus();
    }
}

// 흔들기 애니메이션 CSS 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    .shake {
        animation: shake 0.5s;
    }
`;
document.head.appendChild(style);
