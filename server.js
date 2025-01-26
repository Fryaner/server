const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const modelUri = 'gpt://b1gveqeqi3omdtmhaqe8/yandexgpt/rc'; 
const iamToken = 't1.9euelZqZl8iZm5mczM6Ojo-PlprJju3rnpWakJjNipnMl8vMxo_IkpPIy8rl8_dJICZD-e8jWDEz_t3z9wlPI0P57yNYMTP-zef1656VmpWai4nKyouezpuRypPPyJqJ7_zF656VmpWai4nKyouezpuRypPPyJqJ.tLXPyu7SmCGtVvbM0pkbZoH8PtAbeucHw9Y9FdXeQM5_ELRtTecLOBQk45ul0djeDV7caWUzPg1GMroCVw7XAw';  // Замените на свой IAM-токен

// app.post('/yandexgpt', async (req, res) => {
//     try {
//         console.log('Received request:', req.body);
//         const { messageText } = req.body;

//         if (!messageText) {
//             console.error('Error: messageText not provided in the request body');
//             return res.status(400).json({ error: 'messageText not provided' });
//         }

//         const response = await axios.post(
//             'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
//             {
//                 modelUri: modelUri,
//                 completionOptions: {
//                     stream: false,
//                     temperature: 0.5,
//                     maxTokens: 100,
//                 },
//                 messages: [{ role: 'user', text: messageText }],
//             },
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${iamToken}`,
//                 },
//             }
//         );

//         res.json(response.data);
//     } catch (error) {
//         console.error('Error proxying request to YandexGPT:', error);
//         res.status(500).json({ error: 'Failed to communicate with YandexGPT API' });
//     }
// });
app.post('/recommendation', async (req, res) => {
  try {
    const { answers } = req.body;
    console.log(answers)
    if (!answers) {
      return res.status(400).json({ error: 'answers not provided' });
    }

    const score = answers.reduce((acc, val) => acc + Number(val.point), 0);
    let serverRecommendation = '';

      if (score <= 15) {
         serverRecommendation = 'Необходимо отдохнуть и уделить время своему здоровью';
      } else if (score <= 30) {
           serverRecommendation = 'Хорошо бы отдохнуть, но ваше состояние в норме';
      } else {
         serverRecommendation = 'Отличное состояние, можете продолжать работу!';
      }

    const yandexGPTRecommendation = await getYandexGPTRecommendation(answers);
    const yandexGPTDiary = await getYandexGPTDiary(answers);

    res.json({serverRecommendation, yandexGPTRecommendation, yandexGPTDiary });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: 'Failed to process recommendation' });
  }
});

app.post('/diary', async (req, res) => {
  try {
    const { text } = req.body;
    console.log(text)
    if (!text) {
      return res.status(400).json({ error: 'answers not provided' });
    }
    const yandexGPTDiary = await getYandexGPTDiary(text);

    res.json(yandexGPTDiary);
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: 'Failed to process recommendation' });
  }
});

async function getYandexGPTRecommendation(answers) {
    try {
      const prompt = `Оцени психологическое состояние человека, исходя из ответов на следующие вопросы:
    1. Как вы себя чувствуете в целом? - ${answers[0].answer}
    2. Какой у вас аппетит? - ${answers[1].answer}
    3. Как вы спите? - ${answers[2].answer}
    4. Как часто вы испытываете стресс? - ${answers[3].answer}
    5. Как вы оцениваете свою концентрацию? - ${answers[4].answer}
    6. Как вы оцениваете свою мотивацию? - ${answers[5].answer}
    7. Как часто вы чувствуете усталость? - ${answers[6].answer}
    8. Как часто вы чувствуете раздражение? - ${answers[7].answer}
    9. Как часто вы общаетесь с друзьями? - ${answers[8].answer}
    10. Как вы оцениваете свою общую жизненную удовлетворенность? - ${answers[9].answer}
    
    Дай несколько советов по улучшению его состояния.`;

        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: modelUri,
                completionOptions: {
                    stream: false,
                    temperature: 0.5,
                    maxTokens: 200,
                },
                 messages: [{ role: 'user', text: prompt }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${iamToken}`,
                },
            }
        );


     if (response.data.result?.alternatives && response.data.result.alternatives.length > 0) {
      return response.data.result.alternatives[0].message.text;
    }
    return null;

    } catch (error) {
      console.error("Ошибка получения рекомендаций от YandexGPT:", error);
      return null;
    }
  }


  async function getYandexGPTDiary(text) {
    try {
      const prompt = `Это мой дневник настроения. Я буду записывать сюда свои чувства и эмоции и хочу чтобы ты на них отреагировал и дал свои рекомендации ксаемо моих чувств мыслей
      и эмоций. Привет, это мой днвеник. ${text}`;

        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: modelUri,
                completionOptions: {
                    stream: false,
                    temperature: 0.5,
                    maxTokens: 200,
                },
                 messages: [{ role: 'user', text: prompt }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${iamToken}`,
                },
            }
        );


     if (response.data.result?.alternatives && response.data.result.alternatives.length > 0) {
      return response.data.result.alternatives[0].message.text;
    }
    return null;

    } catch (error) {
      console.error("Ошибка получения рекомендаций от YandexGPT:", error);
      return null;
    }
  }
app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});