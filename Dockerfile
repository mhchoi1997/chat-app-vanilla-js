# Node 이미지를 사용하여 이미지로 빌드한다.
FROM node

LABEL mhchoi <mhchoi1997@inswave.com>

# 작업 디렉터리 생성
RUN mkdir -p /app

WORKDIR /app

COPY . /app

RUN npm install

CMD ["npm", "start"]


