// 1. ตั้งค่าแผนที่เริ่มต้นที่กรุงเทพมหานคร
const map = L.map('map').setView([13.7563, 100.5018], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 2. ระบบฐานข้อมูลบนมือถือ (Local Storage) บันทึกจุดน้ำท่วมส่วนตัว
let savedFloods = JSON.parse(localStorage.getItem('myFloodPins')) || [];

// แสดงหมุดที่เคยบันทึกไว้ในเครื่อง
savedFloods.forEach(pin => {
    L.marker([pin.lat, pin.lng]).addTo(map)
     .bindPopup('จุดเฝ้าระวังน้ำท่วมที่คุณบันทึกไว้');
});

// เมื่อผู้ใช้แตะที่แผนที่ ให้ปักหมุดและบันทึกลงฐานข้อมูลในมือถือ
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    L.marker([lat, lng]).addTo(map).bindPopup('เพิ่มจุดเฝ้าระวังใหม่แล้ว!').openPopup();
    
    savedFloods.push({lat: lat, lng: lng});
    localStorage.setItem('myFloodPins', JSON.stringify(savedFloods));
});

// 3. ระบบค้นหาสถานที่ (Geocoding API ฟรี)
async function searchLocation() {
    const query = document.getElementById('searchInput').value;
    if(!query) return alert("กรุณาพิมพ์ชื่อสถานที่");

    // บังคับค้นหาในพื้นที่กรุงเทพฯ เพื่อความแม่นยำ
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query} กรุงเทพมหานคร`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if(data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            map.setView([lat, lon], 16); // ซูมไปที่สถานที่นั้น
            L.marker([lat, lon]).addTo(map).bindPopup(data[0].display_name).openPopup();
        } else {
            alert("ไม่พบสถานที่ ลองเปลี่ยนคำค้นหาครับ");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    }
}

// 4. ลงทะเบียน Service Worker เพื่อให้แอปติดตั้งลงมือถือได้
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}