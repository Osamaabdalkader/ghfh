// استيراد دوال Firebase
import { 
  auth, database,
  ref, onValue, update,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const ordersContainer = document.getElementById('orders-container');
const filterBtns = document.querySelectorAll('.filter-btn');
const adminIcon = document.getElementById('admin-icon');

// متغيرات النظام
let currentUserData = null;
let currentOrders = [];
let ordersListener = null;

// تحميل البيانات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupEventListeners();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, user => {
        if (!user) {
            // توجيه إلى صفحة التسجيل إذا لم يكن المستخدم مسجلاً
            window.location.href = 'auth.html';
            return;
        }
        
        // تحميل بيانات المستخدم الحالي
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                currentUserData.uid = user.uid;
                
                // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
                if (currentUserData.isAdmin) {
                    adminIcon.style.display = 'flex';
                    loadOrders('all');
                } else {
                    // إذا لم يكن مشرفاً، توجيه إلى الصفحة الرئيسية
                    window.location.href = 'index.html';
                }
            }
        });
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // فلاتر الطلبات
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadOrders(btn.dataset.filter);
        });
    });
}

// تحميل الطلبات
function loadOrders(filter = 'all') {
    // إزالة المستمع السابق إذا كان موجوداً
    if (ordersListener) {
        ordersListener();
    }
    
    ordersContainer.innerHTML = '<div class="loading-text">جاري تحميل الطلبات...</div>';
    
    const ordersRef = ref(database, 'orders');
    ordersListener = onValue(ordersRef, (snapshot) => {
        ordersContainer.innerHTML = '';
        currentOrders = [];
        
        if (snapshot.exists()) {
            const orders = snapshot.val();
            const ordersArray = [];
            
            for (const orderId in orders) {
                const order = { id: orderId, ...orders[orderId] };
                
                // تطبيق الفلتر
                if (filter === 'all' || order.status === filter) {
                    ordersArray.push(order);
                }
            }
            
            currentOrders = ordersArray;
            
            if (ordersArray.length > 0) {
                // تجميع الطلبات حسب المنشور
                const ordersByPost = groupOrdersByPost(ordersArray);
                
                // عرض الطلبات المجمعة
                ordersByPost.forEach(postOrders => {
                    const orderElement = createPostOrderItem(postOrders);
                    ordersContainer.appendChild(orderElement);
                });
            } else {
                ordersContainer.innerHTML = '<p class="no-orders">لا توجد طلبات</p>';
            }
        } else {
            ordersContainer.innerHTML = '<p class="no-orders">لا توجد طلبات</p>';
        }
    });
}

// تجميع الطلبات حسب المنشور
function groupOrdersByPost(orders) {
    const postsMap = {};
    
    orders.forEach(order => {
        if (!postsMap[order.postId]) {
            postsMap[order.postId] = {
                postId: order.postId,
                postTitle: order.postTitle,
                postImage: order.postImage,
                orders: []
            };
        }
        postsMap[order.postId].orders.push(order);
    });
    
    return Object.values(postsMap);
}

// إنشاء عنصر طلب مجمع حسب المنشور
function createPostOrderItem(postData) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.dataset.postId = postData.postId;
    
    // عد الطلبات حسب الحالة
    const statusCounts = {
        pending: postData.orders.filter(o => o.status === 'pending').length,
        approved: postData.orders.filter(o => o.status === 'approved').length,
        rejected: postData.orders.filter(o => o.status === 'rejected').length
    };
    
    orderElement.innerHTML = `
        <div class="order-header">
            <h3 class="order-title">${postData.postTitle}</h3>
            <span class="order-count">${postData.orders.length} طلب</span>
        </div>
        
        <div class="order-statuses">
            ${statusCounts.pending > 0 ? `
                <span class="status-badge status-pending">${statusCounts.pending} قيد الانتظار</span>
            ` : ''}
            ${statusCounts.approved > 0 ? `
                <span class="status-badge status-approved">${statusCounts.approved} مقبولة</span>
            ` : ''}
            ${statusCounts.rejected > 0 ? `
                <span class="status-badge status-rejected">${statusCounts.rejected} مرفوضة</span>
            ` : ''}
        </div>
        
        <div class="order-meta">
            <span>انقر لعرض التفاصيل</span>
        </div>
    `;
    
    orderElement.addEventListener('click', () => {
        // حفظ طلبات المنشور والانتقال إلى صفحة التفاصيل
        localStorage.setItem('currentPostOrders', JSON.stringify(postData));
        window.location.href = 'order-detail.html';
    });
    
    return orderElement;
}