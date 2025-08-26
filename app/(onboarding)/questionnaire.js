// This is a comment to force a file refresh
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../services/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

const QUESTIONS = [
  {
    q: 'Koliko dugo igrate?',
    key: 'years',
    icon: 'time-outline',
    options: [
      'Manje od 6 meseci',
      '6 Meseci do 2 Godine',
      '2 do 5 Godina',
      'Vise od 5 Godina',
    ],
  },
  {
    q: 'Koliko sati nedeljno igrate?',
    key: 'perWeek',
    icon: 'calendar-outline',
    options: [
      'Manje od 2 sata',
      '2 do 5 Sati',
      '5 do 10 Sati',
      'Vise od 10 Sati',
    ],
  },
  {
    q: 'Kako bi ste opisali vas nivo?',
    key: 'skill',
    icon: 'trending-up-outline',
    options: [
      'Pocetni',
      'Prosecni',
      'Napredni',
      'Strucni',
    ],
  },
  {
    q: 'Da li trenirate ili se takmicite?',
    key: 'trained',
    icon: 'trophy-outline',
    options: [
      'Ne samo igram za zabavu',
      'Po nekad treniram',
      'Treniram vise ali se ne takmicim',
      'Treniram aktivno i takmicim se',
    ],
  },
];

const QUESTION_POINTS = [
  [0, 150, 300, 600],   // Koliko dugo igrate?
  [0, 100, 200, 400],   // Koliko sati nedeljno igrate?
  [0, 200, 400, 600],   // Kako bi ste opisali vas nivo?
  [0, 150, 300, 500],   // Da li trenirate ili se takmicite?
];
const minRank = 250;
const maxRank = 500;
const minPoints = 0;
const maxPoints = 600 + 400 + 600 + 500; // 2100

function calculateStartingRank(answerIndices) {
  let totalPoints = answerIndices.reduce(
    (sum, answerIdx, i) => sum + QUESTION_POINTS[i][answerIdx], 0
  );
  return Math.round(
    minRank + ((totalPoints - minPoints) / (maxPoints - minPoints)) * (maxRank - minRank)
  );
}

const QuestionnaireScreen = ({ onClose, initialSport, onFinish }) => {
  const { sport: paramSport } = useLocalSearchParams();
  const sport = initialSport || paramSport;
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const router = useRouter();

  const handleChange = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };

  const nextQuestion = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Niste prijavljeni.');
      // Map answers to indices for each question
      const answerIndices = [
        // Koliko dugo igrate?
        ['Manje od 6 meseci', '6 Meseci do 2 Godine', '2 do 5 Godina', 'Vise od 5 Godina'].indexOf(answers.years),
        // Koliko sati nedeljno igrate?
        ['Manje od 2 sata', '2 do 5 Sati', '5 do 10 Sati', 'Vise od 10 Sati'].indexOf(answers.perWeek),
        // Kako bi ste opisali vas nivo?
        ['Pocetni', 'Prosecni', 'Napredni', 'Strucni'].indexOf(answers.skill),
        // Da li trenirate ili se takmicite?
        ['Ne samo igram za zabavu', 'Po nekad treniram', 'Treniram vise ali se ne takmicim', 'Treniram aktivno i takmicim se'].indexOf(answers.trained),
      ];
      if (answerIndices.some(idx => idx === -1)) throw new Error('Odgovorite na sva pitanja.');
      const score = calculateStartingRank(answerIndices);
      // Save to user_sport_ranks table
      const { error } = await supabase.from('user_sport_ranks').upsert({
        user_id: user.id,
        sport,
        q1_answer: answerIndices[0],
        q2_answer: answerIndices[1],
        q3_answer: answerIndices[2],
        q4_answer: answerIndices[3],
        rank: score,
        updated_at: new Date().toISOString(),
      }, { onConflict: ['user_id', 'sport'] });
      if (error) throw error;
      setMessage('Uspešno sacuvano!');
      setTimeout(() => {
        if (onFinish) onFinish();
        else router.replace('/(tabs)');
      }, 1000);
    } catch (e) {
      setMessage(e.message); // Only set the error message itself, not 'Greška: ...'
    }
    setLoading(false);
  };

  const progress = (currentQuestion + 1) / QUESTIONS.length;
  const currentQ = QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const canProceed = answers[currentQ.key];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Header with Progress */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{currentQuestion + 1} od {QUESTIONS.length}</Text>
          </View>
          
          <View style={styles.questionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={currentQ.icon} size={24} color="#FFFF00" />
            </View>
            <Text style={styles.questionTitle}>{currentQ.q}</Text>
          </View>
        </View>

        {/* Options */}
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {currentQ.options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionCard,
                answers[currentQ.key] === option && styles.optionCardSelected
              ]}
              onPress={() => handleChange(currentQ.key, option)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionNumber}>
                  <Text style={styles.optionNumberText}>{index + 1}</Text>
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQ.key] === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                                 {answers[currentQ.key] === option && (
                   <View style={styles.checkmark}>
                     <Ionicons name="checkmark" size={20} color="#2a3441" />
                   </View>
                 )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Navigation and Finish */}
        <View style={styles.navigationContainer}>
          {message && (
            <Text
              style={[
                styles.message,
                message.toLowerCase().includes('uspešno') ? { color: '#4CAF50' } : { color: '#F44336' }
              ]}
            >
              {message}
            </Text>
          )}
          
          <View style={styles.buttonRow}>
            {currentQuestion > 0 && (
              <TouchableOpacity
                onPress={prevQuestion}
                style={styles.navButton}
              >
                                 <Ionicons name="chevron-back" size={20} color="#000" />
                 <Text style={styles.navButtonText}>Nazad</Text>
              </TouchableOpacity>
            )}
            
            {!isLastQuestion ? (
              <TouchableOpacity
                onPress={nextQuestion}
                disabled={!canProceed}
                style={[
                  styles.nextButton,
                  !canProceed && styles.nextButtonDisabled
                ]}
              >
                                 <Text style={styles.nextButtonText}>Sledece</Text>
                 <Ionicons name="chevron-forward" size={20} color="#000" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleFinish}
                disabled={loading || !canProceed}
                style={[
                  styles.finishButton,
                  (!canProceed || loading) && styles.finishButtonDisabled
                ]}
              >
                {loading ? (
                  <Text style={styles.finishButtonText}>Cuvam...</Text>
                ) : (
                  <>
                    <Text style={styles.finishButtonText}>Završi</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a3441',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#4a5568',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFF00',
    borderRadius: 3,
  },
  progressText: {
    color: '#b0b8c1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  questionTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFF00',
    lineHeight: 32,
  },
  optionsContainer: {
    flex: 1,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#232b3b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardSelected: {
    borderColor: '#FFFF00',
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a5568',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionNumberText: {
    color: '#b0b8c1',
    fontSize: 16,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    color: '#FFFF00',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationContainer: {
    paddingBottom: 20,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#232b3b',
    borderWidth: 1,
    borderColor: '#FFFF00',
  },
  navButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#FFFF00',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#4a5568',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#FFFF00',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  finishButtonDisabled: {
    backgroundColor: '#4a5568',
    opacity: 0.6,
  },
  finishButtonText: {
    color: '#2a3441',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default QuestionnaireScreen; 