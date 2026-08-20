import React, { useState, useEffect, useContext } from "react";
import { Button, Spin, message } from "antd";
import { getGameQuestionApi, submitGameAnswerApi } from "../../apis";
import { AuthContext } from "../../components/common/context/auth.context";

import GameHeader from "../../components/user/game/GameHeader";
import GameCard from "../../components/user/game/GameCard";

const GamePage = () => {
  const { setAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);

  const fetchQuestion = async () => {
    setLoading(true);
    setResult(null);
    setSelectedOption(null);
    try {
      const res = await getGameQuestionApi();
      if (res && res.success) {
        setQuestion(res.data);
      } else {
        message.error(res.message || "Lỗi khi lấy câu hỏi");
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleSelectOption = async (option) => {
    if (result || submitting) return;
    setSelectedOption(option);
    setSubmitting(true);

    try {
      const res = await submitGameAnswerApi(question.token, option);
      if (res && res.success) {
        setResult(res);
        if (res.isCorrect) {
          message.success(`Chính xác! Bạn nhận được ${res.coinsEarned} xu! 🎉`);
          setAuth((prev) => ({
            ...prev,
            user: {
              ...prev.user,
              coins: (prev.user.coins || 0) + res.coinsEarned,
            },
          }));
        } else {
          message.error(`Rất tiếc, đáp án đúng là ${res.correctName}`);
        }
      } else {
        message.error(res.message || "Có lỗi khi nộp câu trả lời");
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <GameHeader />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : !question ? (
          <div className="text-center">
            <Button type="primary" onClick={fetchQuestion} size="large">
              Tải lại trò chơi
            </Button>
          </div>
        ) : (
          <GameCard
            question={question}
            result={result}
            submitting={submitting}
            selectedOption={selectedOption}
            handleSelectOption={handleSelectOption}
            fetchQuestion={fetchQuestion}
          />
        )}
      </div>
    </div>
  );
};

export default GamePage;
