import base64
from unittest import mock

import redis
from fastapi.testclient import TestClient
from requests.auth import HTTPBasicAuth

from .main import app

client = TestClient(app)


def test_hello_default():
    response = client.get("/hello")
    payload = response.json()
    assert response.status_code == 200
    assert payload["message"] == "Hello there, Toph!"

def test_bad_cred():
    auth = HTTPBasicAuth(username="aang", password="all")
    response = client.get("/bender?name=Peyton", auth=auth)
    payload = response.json()
    assert response.status_code == 401
    assert payload["detail"] == "Incorrect email or password"

def test_get_bender_not_exists(mocker):
    auth = HTTPBasicAuth(username="aang", password="all4elements")
    mocker.patch.object(redis.Redis, 'get', return_value = None)

    response = client.get("/bender?name=Peyton", auth=auth)
   
    payload = response.json()
    assert response.status_code == 404
    assert payload["detail"] == "bender not found."

def test_get_bender_exists(mocker):
    auth = HTTPBasicAuth(username="aang", password="all4elements")
    mocker.patch.object(redis.Redis, 'get', return_value = "water")

    response = client.get("/bender?name=Katara", auth=auth)
   
    payload = response.json()
    assert response.status_code == 200
    assert payload["name"] == "Katara"
    assert payload["element"] == "water"

def test_post_bender(mocker):
    auth = HTTPBasicAuth(username="aang", password="all4elements")
    mocker.patch.object(redis.Redis, 'set')
    response = client.post(
        "/bender",
        json={"name": "Katara", "element": "water"},
        auth=auth
    )
    assert response.status_code == 200
    assert response.json() == {"message":"Set element for Katara!"}

# TODO: complete me
