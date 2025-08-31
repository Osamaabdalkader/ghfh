// استيراد دوال Firebase
import { 
  auth, database,
  ref, onValue, update,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const orderDetailContent = document.getElementById('order-detail-content');
const orderActions = document.getElementById('order-actions');
const adminIcon = document.getElementById('admin-icon');

// متغيرات النظام
let currentUserData = null;
let currentPostOrders = null;

// تحميل البيانات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
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
                    loadOrderDetails();
                } else {
                    // إذا لم يكن مشرفاً، توجيه إلى الصفحة الرئيسية
                    window.location.href = 'index.html';
                }
            }
        });
    });
}

// تحميل تفاصيل الطلب
function loadOrderDetails() {
    const postOrdersData = JSON.parse(localStorage.getItem('currentPostOrders'));
    
    if (!postOrdersData) {
        orderDetailContent.innerHTML = '<p class="error">لم يتم العثور على بيانات الطلب</p>';
        // العودة إلى صفحة الطلبات بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 2000);
        return;
    }
    
    currentPostOrders = postOrdersData;
    displayOrderDetails(postOrdersData);
}

// عرض تفاصيل الطلب
function displayOrderDetails(postOrders) {
    orderDetailContent.innerHTML = '';
    orderActions.innerHTML = '';
    
    // عرض معلومات المنشور
    const postInfo = document.createElement('div');
    postInfo.className = 'order-detail-section';
    postInfo.innerHTML = `
        <h3>معلومات المنشور</h3>
        <div class="order-detail-item">
            <span class="order-detail-label">العنوان:</span>
            <span class="order-detail-value">${postOrders.postTitle}</span>
        </div>
        ${postOrders.postImage ? `
            <div class="order-detail-item">
                <span class="order-detail-label">الصورة:</span>
                <img src="${postOrders.postImage}" alt="صورة المنشور" style="max-width: 200px; margin-top: 10px;">
            </div>
        ` : ''}
    `;
    orderDetailContent.appendChild(postInfo);
    
    // عرض الطلبات الفردية
    const ordersList = document.createElement('div');
    ordersList.className = 'order-detail-section';
    ordersList.innerHTML = '<h3>الطلبات على هذا المنشور</h3>';
    
    postOrders.orders.forEach(order => {
        const orderElement = createIndividualOrderItem(order);
        ordersList.appendChild(orderElement);
    });
    
    orderDetailContent.appendChild(ordersList);
}

// إنشاء عنصر طلب فردي
function createIndividualOrderItem(order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item individual-order';
    orderElement.dataset.orderId = order.id;
    
    // الحصول على اسم المشتري إذا كان متاحاً
    const buyerName = order.buyerName || 'مشتري';
    
    // تنسيق الحالة
    let statusClass = '';
    let statusText = '';
    
    switch(order.status) {
        case 'pending':
            statusClass = 'status-pending';
            statusText = 'قيد الانتظار';
            break;
        case 'approved':
            statusClass = 'status-approved';
            statusText = 'مقبول';
            break;
        case 'rejected':
            statusClass = 'status-rejected';
            statusText = 'مرفوض';
            break;
        default:
            statusClass = 'status-pending';
            statusText = order.status;
    }
    
    // تنسيق التاريخ
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : 'غير معروف';
    
    orderElement.innerHTML = `
        <div class="order-header">
            <h3 class="order-title">طلب من ${buyerName}</h3>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="order-meta">
            <span>السعر: ${order.postPrice || 'غير محدد'}</span>
            <span>التاريخ: ${orderDate}</span>
        </div>
        
        <div class="order-actions">
            ${order.status === 'pending' ? `
                <button class="btn btn-success approve-btn" data-order-id="${order.id}">قبول</button>
                <button class="btn btn-danger reject-btn" data-order-id="${order.id}">رفض</button>
            ` : ''}
            <button class="btn btn-primary chat-btn" data-order-id="${order.id}">التحدث مع المشتري</button>
        </div>
    `;
    
    // إضافة مستمعي الأحداث للأزرار
    const approveBtn = orderElement.querySelector('.approve-btn');
    const rejectBtn = orderElement.querySelector('.reject-btn');
    const chatBtn = orderElement.querySelector('.chat-btn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            approveOrder(order.id);
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rejectOrder(order.id);
        });
    }
    
    if (chatBtn) {
        chatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatWithBuyer(order.buyerId);
        });
    }
    
    return orderElement;
}

// قبول الطلب
async function approveOrder(orderId) {
    try {
        await update(ref(database, 'orders/' + orderId), {
            status: 'approved',
            processedAt: Date.now(),
            processedBy: auth.currentUser.uid
        });
        
        alert('تم قبول الطلب بنجاح');
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
    } catch (error) {
        console.error('Error approving order:', error);
        alert('حدث خطأ أثناء قبول الطلب. يرجى المحاولة مرة أخرى.');
    }
}

// رفض الطلب
async function rejectOrder(orderId) {
    try {
        await update(ref(database, 'orders/' + orderId), {
            status: 'rejected',
            processedAt: Date.now(),
            processedBy: auth.currentUser.uid
        });
        
        alert('تم رفض الطلب بنجاح');
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
    } catch (error) {
        console.error('Error rejecting order:', error);
        alert('حدث خطأ أثناء رفض الطلب. يرجى المحاولة مرة أخرى.');
    }
}

// التحدث مع المشتري
function chatWithBuyer(buyerId) {
    // حفظ معرف المشتري والانتقال إلى صفحة الرسائل
    localStorage.setItem('chatWithUser', buyerId);
    window.location.href = 'messages.html';
}