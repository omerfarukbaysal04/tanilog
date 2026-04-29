from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter()

# Şifreleme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# --- Şemalar ---

class UserCreate(BaseModel):
    """Kullanıcı kayıt şeması."""
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    """Kullanıcı yanıt şeması."""
    id: int
    email: str
    full_name: str
    is_active: bool
    is_premium: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token yanıt şeması."""
    access_token: str
    token_type: str


# --- Yardımcı Fonksiyonlar ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Düz metin şifreyi hash ile doğrular."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Şifreyi hash'ler."""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """JWT erişim token'ı oluşturur."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Token'dan mevcut kullanıcıyı çözer."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulama başarısız.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# --- Endpoint'ler ---

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             summary="Yeni kullanıcı kaydı")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yeni bir kullanıcı hesabı oluşturur."""
    # E-posta kontrolü
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanılıyor.",
        )

    # Kullanıcı oluştur
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token, summary="Kullanıcı girişi")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """E-posta ve şifre ile giriş yaparak JWT token alır."""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse, summary="Mevcut kullanıcı bilgisi")
async def get_me(current_user: User = Depends(get_current_user)):
    """Giriş yapmış kullanıcının bilgilerini döner."""
    return current_user
