// استيراد دوال Firebase
import { 
  auth, database, serverTimestamp, ref, push, set 
} from './firebase.js';

// عناصر DOM
const postDetailContent = document.getElementById('post-detail-content');
const buyNowBtn = document.getElementById('buy-now-btn');
const adminIcon = document.getElementById('admin-icon');

// تحميل تفاصيل المنشور
document.addEventListener('DOMContentLoaded', () => {
    const postData = JSON.parse(localStorage.getItem('currentPost'));
    if (postData) {
        showPostDetail(postData);
    } else {
        postDetailContent.innerHTML = '<p class="error">لم يتم العثور على المنشور</p>';
        // العودة إلى الصفحة الرئيسية بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
    
    // التحقق من صلاحية المستخدم وإظهار أيقونة الإدارة إذا لزم الأمر
    const userData = JSON.parse(localStorage.getItem('currentUserData'));
    if (userData && userData.isAdmin) {
        adminIcon.style.display = 'flex';
    }
});

// عرض تفاصيل المنشور
function showPostDetail(post) {
    postDetailContent.innerHTML = `
        ${post.imageUrl ? `
            <img src="${post.imageUrl}" alt="${post.title}" class="post-detail-image">
        ` : ''}
        <h2 class="post-detail-title">${post.title}</h2>
        <p class="post-detail-description">${post.description}</p>
        
        <div class="post-detail-meta">
            <div class="meta-item">
                <i class="fas fa-tag"></i>
                <span>السعر: ${post.price || 'غير محدد'}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>المكان: ${post.location || 'غير محدد'}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-phone"></i>
                <span>رقم الهاتف: ${post.phone || 'غير متاح'}</span>
            </div>
        </div>
        
        <div class="post-detail-author">
            <div class="author-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="author-info">
                <div class="author-name">${post.authorName || 'مستخدم'}</div>
                <div class="author-contact">تواصل مع البائع</div>
            </div>
        </div>
    `;
}

// زر اشتري الآن
buyNowBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = 'auth.html';
        return;
    }
    
    const postData = JSON.parse(localStorage.getItem('currentPost'));
    createOrder(user.uid, postData);
});

// إنشاء طلب جديد
async function createOrder(userId, post) {
    try {
        const orderData = {
            buyerId: userId,
            sellerId: post.authorId,
            postId: post.id,
            postTitle: post.title,
            postPrice: post.price || 'غير محدد',
            postImage: post.imageUrl || '',
            status: 'pending',
            createdAt: serverTimestamp()
        };

        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, orderData);
        
        alert('تم إنشاء الطلب بنجاح! سيتم التواصل معك قريباً.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error creating order:', error);
        alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    }
}lt"></i>
                    <span>الموقع: ${post.location || 'غير محدد'}</span>
                </div>
                
                <div class="meta-item">
                    <i class="fas fa-phone"></i>
                    <span>رقم الهاتف: ${post.phone || 'غير محدد'}</span>
                </div>
            </div>
            
            <div class="post-detail-author">
                <div class="author-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="author-info">
                    <div class="author-name">${post.authorName || 'مستخدم مجهول'}</div>
                    <div class="author-contact">${post.authorPhone || 'غير متاح'}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error displaying post details:', error);
    }
}

// إنشاء طلب جديد
async function createOrder(userId, post) {
    try {
        const orderData = {
            buyerId: userId,
            sellerId: post.authorId,
            postId: post.id,
            postTitle: post.title,
            postPrice: post.price || 'غير محدد',
            postImage: post.imageUrl || '',
            status: 'pending',
            createdAt: serverTimestamp()
        };
        
        // حفظ الطلب في قاعدة البيانات
        await push(ref(database, 'orders'), orderData);
        showAlert('تم إرسال طلبك بنجاح! سوف تتواصل معك الإدارة قريباً.', 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد ثانيتين
        setTimeout(() => {
            navigateTo('index.html');
        }, 2000);
    } catch (error) {
        console.error('Error creating order: ', error);
        showAlert('حدث خطأ أثناء إرسال الطلب: ' + error.message, 'error');
    }
}

// تشغيل التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initPostDetailPage();
});