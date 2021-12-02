import os
import secrets

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from redis import Redis

app = FastAPI()
conn = Redis.from_url(os.getenv("REDIS_URL", "redis://redis/0"))
templates = Jinja2Templates(directory="/templates")

security = HTTPBasic()
auth_user = os.getenv("ADMIN_USERNAME", "aang")
auth_password = os.getenv("ADMIN_PASSWORD", "all4elements")


def get_admin_username(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    if auth_user is None or auth_password is None:
        return "guestuser"
    correct_username = secrets.compare_digest(credentials.username, auth_user)
    correct_password = secrets.compare_digest(credentials.password, auth_password)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@app.get("/hello")
def hello_view(name: str = "Toph"):
    return {"message": f"Hello there, {name}!"}


class Bender(BaseModel):
    name: str
    element: str


@app.post("/bender")
def add_bender(bender: Bender, username: str = Depends(get_admin_username)):
    conn.set(bender.name, bender.element)
    return {"message": f"Set element for {bender.name}!"}


@app.get("/bender")
def get_bender(name: str, username: str = Depends(get_admin_username)):
    if len(name) == 0:
        raise HTTPException(status_code=400, detail="Bender must have a name.")
    value = conn.get(name)
    if value is None:
        raise HTTPException(status_code=404, detail="bender not found.")

    return {"name": name, "element": value}


@app.get("/info", response_class=HTMLResponse)
def get_info(request: Request, username: str = Depends(get_admin_username)):
    bender_names = conn.keys()
    bender_dict = dict(
        [
            (name.decode("utf-8"), conn.get(name).decode("utf-8"))
            for name in bender_names
        ]
    )
    return templates.TemplateResponse(
        "info.html.j2", {"request": request, "benders": bender_dict}
    )
