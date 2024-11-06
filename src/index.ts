import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import * as dotenv from "dotenv";
import * as path from "path";
import * as readline from "readline";
import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInNlc3Npb25JZCI6ImMyNmMzODFkMjg2NTg3YWYzNzc0ZTY0MzgzNDI2ZGEwIiwidXNlckluZm8iOnsiaWQiOjEsImVtYWlsIjoiY2hhcGxldDAxQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiZGV2a2ltc29uIn0sImlhdCI6MTczMDI3NTUzNX0.HNoRNYJ4SAIvW58ObtaGKZJzYCol6ZvYKTtyL0RVwlw";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import * as fs from "fs";

// const nike10kPdfPath = "./src/korean.pdf";
// const singleDocPerFileLoader = new PDFLoader(nike10kPdfPath, {
//   splitPages: false,
// });

// singleDocPerFileLoader.load().then((singleDoc) => {
//   fs.writeFileSync("./src/korean.txt", singleDoc[0].pageContent);
// });

// 환경 설정
dotenv.config({ path: path.resolve(__dirname, ".env") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 초기 시스템 프롬프트 템플릿 설정
const systemTemplate = "항상 {language}로 겸손하게 말해야 합니다.";
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["assistant", "네, 한국어로 번역하겠습니다."],
  // [
  //   "system",
  //   "지금부터 너는 사용자가 질문하면 다음 포맷에 맞춰 JSON으로만 응답해야해. method, url, body, query, headers, cookie. 사용자의 요청에 따른 데이터는 무조건 포함해야해. 필요없는 데이터는 undefined 값을 주면 돼.",
  // ],
  // [
  //   "system",
  //   "사용자 질문을 토대로 분석하고 어떤것을 원하는지 내가 제공한 api 명세서를 바탕으로 요청할 메서드와 url, body 등의 포맷을 따라 응답해야해.",
  // ],
  // [
  //   "system",
  //   "요청 메서드는 get, post, put, delete 중 하나여야 합니다. url은 /로 시작해야 합니다.",
  // ],
  // ["system", "POST, /users : 회원가입 API"],
  // ["system", "GET, /users : 모든 회원 리스트 조회"],
  // ["system", "GET, /users/:id : 특정 회원 조회"],
  // ["system", "GET, /users/condition : 파라미터로 조건 조회"],
  // ["assistant", "네, 이해했습니다."],
  // ["system", "회원 조회해줘."],
  // ["assistant", '{{"method":"get","url":"/users"}}'],
  // ["system", "GET 요청 중 condition 엔드포인트만 query가 있어."],
  // [
  //   "system",
  //   "GET 요청에서 users/:id는 경로에 숫자만 있어. 예시 응답) {{'method':'get','url':'/users/:id'}}",
  // ],
  // [
  //   "system",
  //   "n번 유저 조회해줘. 예시 응답) {{'method':'get','url':'/users/n'}}",
  // ],
  // [
  //   "system",
  //   "2번 유저 조회해줘. 예시 응답) {{'method':'get','url':'/users/2'}}",
  // ],
  // ["system", "전체 유저 조회 응답 예시) {{'method':'get','url':'/users'}}"],
  // [
  //   "system",
  //   "메일에 02가 포함된 유저 조회 응답 예시) {{'method':'get','url':'/users/condition','query':'?email=02'}}",
  // ],
  // [
  //   "system",
  //   "메일에 ch가 포함된 유저 조회 응답 예시) {{'method':'get','url':'/users/condition','query':'?email=ch'}}",
  // ],
  // [
  //   "system",
  //   "메일에 ch가 포함되고 이름에 dev가 포함된 유저 조회 응답 예시) {{'method':'get','url':'/users/condition','query':'?email=ch&username=dev'}}",
  // ],
  // [
  //   "system",
  //   "이름에 dev가 포함된 유저 조회 응답 예시) {{'method':'get','url':'/users/condition','query':'?username=dev'}}",
  // ],
  // ["system", "유저 조회 응답 예시) {{'method':'get','url':'/users'}}"],
  // [
  //   "system",
  //   "대화 내용에 따라 JSON을 형성해야하고 대화 내용에 없는 속성은 절대 넣지 않는다.",
  // ],
  // [
  //   "system",
  //   "회원가입 바디 포맷은 email,username,password,role이다. role은 ADMIN과 USER만 있다.",
  // ],
  // ["system", "system 등록된 조건 외 거짓으로 응답하지 마."],

  new MessagesPlaceholder("chatHistory"),
  ["user", "{input}"],
]);

async function startChat() {
  const parser = new StringOutputParser();

  // Ollama 모델 설정
  const model = new ChatOllama({
    model: "jarvis",
    temperature: 0.5,
    topP: 1,
  });

  // 대화 히스토리 초기화
  const messages = [new SystemMessage("항상 한국어로 겸손하게 말해야 합니다.")];

  const llmChain = promptTemplate.pipe(model).pipe(parser);
  let keepRunning = true;

  while (keepRunning) {
    await new Promise((resolve) => {
      rl.question("질문을 입력하세요: ", async (input) => {
        if (input === "exit") {
          keepRunning = false;
          rl.close();
          return;
        }

        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 1);

        console.log("사용자:", input);

        // 사용자 입력 추가
        messages.push(new HumanMessage(input));

        console.log("생각 중...");
        // `invoke` 호출 시 `chatHistory` 변수로 히스토리 전달
        const result = await llmChain.invoke({
          chatHistory: messages,
          language: "한국어",
          input: input,
        });

        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 1);

        // try {
        //   const { method, url, body, query } = JSON.parse(
        //     result.trim().replace(/'/g, '"')
        //   ) as Record<string, any>;
        //   console.log("챗봇:", result);
        //   console.log(body);
        //   if (method.toLowerCase() === "post") {
        //     try {
        //       const { data, status } = await axios[method.toLowerCase()](
        //         "http://localhost:8080/api" + url,
        //         body,
        //         {
        //           headers: {
        //             "Content-Type": "application/json",
        //             Cookie: `token=${TOKEN};`,
        //           },
        //           withCredentials: true,
        //         }
        //       );

        //       // 챗봇 응답을 히스토리에 추가
        //       messages.push(new AIMessage(result));
        //       if (status === 200 || status === 201) {
        //         console.log("응답:", data);
        //       } else {
        //         console.log("응답 실패:", status);
        //       }
        //     } catch (error) {
        //       console.error(
        //         "에러:",
        //         error.message.toString().slice(0, 100) + "..."
        //       );
        //     }
        //   } else {
        //     try {
        //       const totalUrl =
        //         "http://localhost:8080/api" + url + (query || "");
        //       console.log("Chatbot request url:", totalUrl);
        //       const { data, status } = await axios[method.toLowerCase()](
        //         totalUrl,
        //         {
        //           headers: {
        //             Cookie: `token=${TOKEN};`,
        //           },
        //           withCredentials: true,
        //         }
        //       );

        //       // 챗봇 응답을 히스토리에 추가
        //       messages.push(new AIMessage(result));
        //       if (status === 200) {
        //         console.log("응답:", data);
        //       } else {
        //         console.log("응답 실패:", status);
        //       }
        //     } catch (error) {
        //       console.error(
        //         "에러:",
        //         error.message.toString().slice(0, 100) + "..."
        //       );
        //     }
        //   }
        // } catch (error) {
        //   console.log("챗봇 :", result);
        //   messages.push(new AIMessage(result));
        // }
        console.log("챗봇:", result);
        messages.push(new AIMessage(result));
        resolve(null);
      });
    });
  }
}

startChat();
