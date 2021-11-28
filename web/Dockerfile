FROM python:3.8-buster

ENV POETRY_VERSION=1.0.8

#System dependencies
RUN pip install "poetry==$POETRY_VERSION"

# make templates directory for eventual mounting
RUN mkdir /templates

WORKDIR /app/

COPY pyproject.toml /app/
COPY poetry.lock /app/

RUN poetry install --no-dev

COPY . /app/

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0"]
