// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // 모바일 메뉴 닫기
            document.querySelector('.nav-menu').classList.remove('active');
        }
    });
});

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

mobileMenuBtn.addEventListener('click', function() {
    navMenu.classList.toggle('active');
});

// Carousel functionality
const carouselInner = document.querySelector('.carousel-inner');
const originalItems = document.querySelectorAll('.carousel-item');
const prevBtn = document.querySelector('.carousel-control.prev');
const nextBtn = document.querySelector('.carousel-control.next');
const dotsContainer = document.querySelector('.carousel-dots');
const dots = document.querySelectorAll('.dot');
const carouselContainer = document.querySelector('.hero-image-carousel');
let currentIndex = 1; // 복제된 슬라이드 때문에 1부터 시작
let totalSlides = originalItems.length;
let isTransitioning = false; // 전환 중인지 체크하는 플래그

// 무한 루프를 위한 복제 슬라이드 생성
function createInfiniteSlides() {
    // 마지막 슬라이드를 맨 앞에 복제
    const lastSlideClone = originalItems[originalItems.length - 1].cloneNode(true);
    lastSlideClone.classList.remove('active');
    carouselInner.insertBefore(lastSlideClone, originalItems[0]);
    
    // 첫 번째 슬라이드를 맨 뒤에 복제
    const firstSlideClone = originalItems[0].cloneNode(true);
    firstSlideClone.classList.remove('active');
    carouselInner.appendChild(firstSlideClone);
    
    // 모든 슬라이드 아이템 다시 선택 (복제된 것 포함)
    return document.querySelectorAll('.carousel-item');
}

const carouselItems = createInfiniteSlides();

// Touch/swipe variables
let startX = 0;
let startY = 0;
let endX = 0;
let currentX = 0;
let isDragging = false;
let startTime = 0;
let dragOffset = 0;
let initialTransform = 0;

function showSlide(index, smooth = true) {
    currentIndex = index;
    
    // 전환 시작 시 플래그 설정
    if (smooth) {
        isTransitioning = true;
    }
    
    // 부드러운 전환 효과 설정
    if (smooth) {
        carouselInner.style.transition = 'transform 0.3s ease-out';
    } else {
        carouselInner.style.transition = 'none';
    }
    
    // Safari 호환성을 위해 translate3d 사용
    const translateX = -currentIndex * 100;
    const transformValue = `translate3d(${translateX}%, 0, 0)`;
    carouselInner.style.transform = transformValue;
    carouselInner.style.webkitTransform = transformValue;
    carouselInner.style.MozTransform = transformValue;
    carouselInner.style.msTransform = transformValue;
    
    // Safari에서 강제 렌더링 트리거
    carouselInner.offsetHeight;
    
    // 무한 루프 처리 - 전환 완료 후 위치 조정
    if (smooth) {
        setTimeout(() => {
            if (currentIndex === 0) {
                // 첫 번째 복제본에서 실제 마지막 슬라이드로 점프
                currentIndex = totalSlides;
                carouselInner.style.transition = 'none';
                const jumpTransform = `translate3d(${-currentIndex * 100}%, 0, 0)`;
                carouselInner.style.transform = jumpTransform;
                carouselInner.style.webkitTransform = jumpTransform;
                carouselInner.style.MozTransform = jumpTransform;
                carouselInner.style.msTransform = jumpTransform;
            } else if (currentIndex === totalSlides + 1) {
                // 마지막 복제본에서 실제 첫 번째 슬라이드로 점프
                currentIndex = 1;
                carouselInner.style.transition = 'none';
                const jumpTransform = `translate3d(${-currentIndex * 100}%, 0, 0)`;
                carouselInner.style.transform = jumpTransform;
                carouselInner.style.webkitTransform = jumpTransform;
                carouselInner.style.MozTransform = jumpTransform;
                carouselInner.style.msTransform = jumpTransform;
            }
            // 전환 완료 후 플래그 해제
            isTransitioning = false;
        }, 300); // 전환 애니메이션 시간과 동일
    }
    
    // 점(dot) 업데이트 - 실제 슬라이드 인덱스 기준
    const realIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    dots.forEach((dot, i) => {
        if (i === realIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function updateCarouselPosition(offsetPercent) {
    const baseTranslate = -currentIndex * 100;
    let newTranslate = baseTranslate + offsetPercent;
    
    // 드래그 제한: 다음/이전 이미지가 완전히 보이면 더 이상 드래그되지 않도록 제한
    const maxTranslate = baseTranslate + 100; // 이전 슬라이드까지
    const minTranslate = baseTranslate - 100; // 다음 슬라이드까지
    
    // 경계를 넘어서면 해당 경계값으로 제한
    if (newTranslate > maxTranslate) {
        newTranslate = maxTranslate;
    } else if (newTranslate < minTranslate) {
        newTranslate = minTranslate;
    }
    
    // Safari 호환성을 위해 transform 속성을 다양한 방식으로 설정
    const transformValue = `translate3d(${newTranslate}%, 0, 0)`;
    carouselInner.style.transition = 'none';
    carouselInner.style.transform = transformValue;
    carouselInner.style.webkitTransform = transformValue;
    carouselInner.style.MozTransform = transformValue;
    carouselInner.style.msTransform = transformValue;
    
    // Safari에서 강제 렌더링 트리거
    carouselInner.offsetHeight;
    
    // 실제 드래그 오프셋 업데이트 (제한된 값 기준)
    dragOffset = newTranslate - baseTranslate;
}

// Button controls - 터치와 클릭 모두 지원
function handlePrevClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (isTransitioning) return;
    currentIndex--;
    showSlide(currentIndex);
}

function handleNextClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (isTransitioning) return;
    currentIndex++;
    showSlide(currentIndex);
}

// 클릭 이벤트
prevBtn.addEventListener('click', handlePrevClick);
nextBtn.addEventListener('click', handleNextClick);

// 터치 이벤트 추가 (모바일 반응성 향상)
prevBtn.addEventListener('touchend', handlePrevClick);
nextBtn.addEventListener('touchend', handleNextClick);

// mousedown과 touchstart 이벤트 방지
prevBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
});

nextBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
});

prevBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
});

nextBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
});

dots.forEach(dot => {
    function handleDotClick(e) {
        e.stopPropagation();
        e.preventDefault();
        if (isTransitioning) return;
        const targetIndex = parseInt(e.target.dataset.slide) + 1;
        showSlide(targetIndex);
    }
    
    // 클릭과 터치 이벤트 모두 추가
    dot.addEventListener('click', handleDotClick);
    dot.addEventListener('touchend', handleDotClick);
    
    // mousedown과 touchstart 이벤트 방지
    dot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
    });
    
    dot.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
});

// Touch events for mobile swipe
carouselContainer.addEventListener('touchstart', (e) => {
    if (isTransitioning) return; // 전환 중이면 드래그 시작 무시
    
    // 버튼이나 점을 터치한 경우 드래그 시작하지 않음
    if (e.target.closest('.carousel-control') || 
        e.target.closest('.carousel-dots') || 
        e.target.closest('.dot')) {
        return;
    }
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    isDragging = true;
    dragOffset = 0;
}, { passive: true });

carouselContainer.addEventListener('touchmove', (e) => {
    if (!isDragging || isTransitioning) return; // 전환 중이면 드래그 무시
    
    currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    
    // 가로 움직임이 세로 움직임보다 클 때만 preventDefault 호출
    if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
        
        // 드래그 오프셋 계산 (캐러셀 너비 기준 퍼센트)
        const containerWidth = carouselContainer.offsetWidth;
        const rawOffset = ((currentX - startX) / containerWidth) * 100;
        
        // 드래그 제한 적용
        const maxOffset = 100; // 이전 슬라이드까지 (100%)
        const minOffset = -100; // 다음 슬라이드까지 (-100%)
        const limitedOffset = Math.max(minOffset, Math.min(maxOffset, rawOffset));
        
        // 실시간으로 캐러셀 위치 업데이트
        updateCarouselPosition(limitedOffset);
    }
}, { passive: false });

carouselContainer.addEventListener('touchend', (e) => {
    if (!isDragging || isTransitioning) return; // 전환 중이면 터치 종료 무시
    
    endX = e.changedTouches[0].clientX;
    const deltaX = startX - endX;
    const deltaTime = Date.now() - startTime;
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    const velocityThreshold = 0.5; // 속도 기준 (픽셀/ms)
    
    const velocity = Math.abs(deltaX) / deltaTime;
    const shouldChangeSlide = Math.abs(dragOffset) > 50 || // 50% 이상 드래그하면 슬라이드 변경 
                            (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime && velocity > velocityThreshold);
    
    if (shouldChangeSlide) {
        if (dragOffset < 0 || deltaX > 0) {
            // Swipe left - next slide
            currentIndex++;
        } else {
            // Swipe right - previous slide
            currentIndex--;
        }
    }
    
    // 항상 현재 슬라이드 위치로 복귀
    showSlide(currentIndex);
    
    isDragging = false;
    dragOffset = 0;
}, { passive: true });

// Mouse events for desktop drag
carouselContainer.addEventListener('mousedown', (e) => {
    // 왼쪽 마우스 버튼만 처리
    if (e.button !== 0 || isTransitioning) return; // 전환 중이면 마우스 드래그 시작 무시
    
    // 버튼이나 점을 클릭한 경우 드래그 시작하지 않음
    if (e.target.closest('.carousel-control') || 
        e.target.closest('.carousel-dots') || 
        e.target.closest('.dot')) {
        return;
    }
    
    startX = e.clientX;
    startTime = Date.now();
    isDragging = true;
    dragOffset = 0;
    carouselContainer.style.cursor = 'grabbing';
    carouselContainer.style.userSelect = 'none'; // 텍스트 선택 방지
    document.body.style.userSelect = 'none'; // 전체 페이지 텍스트 선택 방지
    
    // 기본 드래그 동작 방지
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || isTransitioning) return; // 전환 중이면 마우스 이동 무시
    
    currentX = e.clientX;
    
    // 드래그 오프셋 계산 (캐러셀 너비 기준 퍼센트)
    const containerWidth = carouselContainer.offsetWidth;
    const rawOffset = ((currentX - startX) / containerWidth) * 100;
    
    // 현재 위치에서 드래그 가능한 범위 계산
    const baseTranslate = -currentIndex * 100;
    const maxOffset = 100; // 이전 슬라이드까지 (100%)
    const minOffset = -100; // 다음 슬라이드까지 (-100%)
    
    // 드래그 제한 적용
    const limitedOffset = Math.max(minOffset, Math.min(maxOffset, rawOffset));
    
    // 실시간으로 캐러셀 위치 업데이트
    updateCarouselPosition(limitedOffset);
    
    // 드래그 중임을 표시
    e.preventDefault();
});

document.addEventListener('mouseup', (e) => {
    if (!isDragging || isTransitioning) return; // 전환 중이면 마우스 업 무시
    
    endX = e.clientX;
    const deltaX = startX - endX;
    const deltaTime = Date.now() - startTime;
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    // 드래그 오프셋과 속도를 기준으로 슬라이드 변경 결정
    const containerWidth = carouselContainer.offsetWidth;
    const swipeThreshold = 30; // 30% 이상 드래그하면 슬라이드 변경
    const velocityThreshold = 0.5; // 속도 기준 (픽셀/ms)

    const velocity = Math.abs(deltaX) / deltaTime;
    const shouldChangeSlide = Math.abs(dragOffset) > 50 || // 50% 이상 드래그하면 슬라이드 변경
                            (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime && velocity > velocityThreshold);

    if (shouldChangeSlide) {
        if (dragOffset < 0 || deltaX > 0) {
            // Swipe left - next slide
            currentIndex++;
        } else {
            // Swipe right - previous slide
            currentIndex--;
        }
    }
    
    // 항상 현재 슬라이드 위치로 복귀
    showSlide(currentIndex);
    
    // 드래그 상태 완전히 리셋
    isDragging = false;
    dragOffset = 0;
    carouselContainer.style.cursor = 'grab';
    carouselContainer.style.userSelect = '';
    document.body.style.userSelect = ''; // body의 선택 방지 해제
});

carouselContainer.addEventListener('mouseleave', () => {
    // 마우스가 영역을 벗어나도 드래그 중이면 계속 유지
    // mouseup에서만 드래그 종료하도록 변경
});

// 컨텍스트 메뉴 방지 (우클릭 메뉴)
carouselContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// 페이지를 벗어나거나 포커스를 잃었을 때 드래그 종료
window.addEventListener('blur', () => {
    if (isDragging) {
        showSlide(currentIndex);
        isDragging = false;
        dragOffset = 0;
        carouselContainer.style.cursor = 'grab';
        carouselContainer.style.userSelect = '';
        document.body.style.userSelect = '';
    }
});

// 마우스가 완전히 브라우저 밖으로 나갔을 때
document.addEventListener('mouseleave', () => {
    if (isDragging) {
        showSlide(currentIndex);
        isDragging = false;
        dragOffset = 0;
        carouselContainer.style.cursor = 'grab';
        carouselContainer.style.userSelect = '';
        document.body.style.userSelect = '';
    }
});

// Auto-play carousel (optional)
// setInterval(() => {
//     currentIndex++;
//     showSlide(currentIndex);
// }, 5000);

// Initialize carousel when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // 잠시 대기 후 초기화 (Safari 렌더링 완료 대기)
    setTimeout(() => {
        initializeCarousel();
    }, 100);
});

function initializeCarousel() {
    // 커서 스타일 설정
    carouselContainer.style.cursor = 'grab';
    
    // 모든 활성 클래스 제거
    carouselItems.forEach(item => item.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // 첫 번째 실제 슬라이드(index 1)를 활성화
    if (carouselItems[currentIndex]) {
        carouselItems[currentIndex].classList.add('active');
    }
    
    // 첫 번째 점을 활성화
    if (dots[0]) {
        dots[0].classList.add('active');
    }
    
    // Safari 호환성을 위한 강제 리플로우
    carouselInner.offsetHeight;
    
    // 초기 위치 설정
    carouselInner.style.transition = 'none';
    const initialTransform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
    carouselInner.style.transform = initialTransform;
    carouselInner.style.webkitTransform = initialTransform;
    carouselInner.style.MozTransform = initialTransform;
    carouselInner.style.msTransform = initialTransform;
    
    // Safari에서 두 번의 강제 렌더링 트리거
    carouselInner.offsetHeight;
    carouselInner.offsetWidth;
    
    // 잠시 후 transition 다시 활성화
    setTimeout(() => {
        carouselInner.style.transition = '';
        // 한 번 더 강제 렌더링
        carouselInner.offsetHeight;
    }, 100);
} 