// This is a comment to force a file refresh
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { responsiveFontSize, scale } from '../../constants/Responsive';
import { supabase } from '../../services/supabaseClient';

const QUESTIONS = [
  {
    q: 'Koliko dugo igrate?',
    key: 'years',
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
  const router = useRouter();

  const handleChange = (key, value) => {
    setAnswers({ ...answers, [key]: value });
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
      setMessage('Uspešno sačuvano!');
      setTimeout(() => {
        if (onFinish) onFinish();
        else router.replace('/(tabs)');
      }, 1000);
    } catch (e) {
      setMessage(e.message); // Only set the error message itself, not 'Greška: ...'
    }
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 12, marginLeft: -36 }}>
          <Text style={{ fontSize: 20, fontWeight: '400', color: '#FFD600', textAlign: 'left', letterSpacing: 0.8 }}>Upitnik</Text>
        </View>
        {/* No chips or + button here, just the questions */}
        {QUESTIONS.map((q, idx) => (
          <View key={q.key} style={{ marginBottom: 12, width: '100%' }}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{q.q}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 6 }}>
              {q.options.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    answers[q.key] === option && styles.optionButtonSelected
                  ]}
                  onPress={() => handleChange(q.key, option)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    answers[q.key] === option && styles.optionButtonTextSelected
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {idx === QUESTIONS.length - 1 && message && (
              <Text
                style={[
                  styles.message,
                  message.toLowerCase().includes('uspešno') ? { color: 'green' } : { color: 'red' }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {message}
              </Text>
            )}
            {idx === QUESTIONS.length - 1 && (
              <TouchableOpacity
                onPress={handleFinish}
                disabled={loading}
                style={[
                  styles.finishButton,
                  loading && { opacity: 0.7 },
                  { marginTop: 8 }
                ]}
              >
                <Text style={styles.finishButtonText} numberOfLines={1} ellipsizeMode="tail">{loading ? 'Čuvam...' : 'Završi'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: responsiveFontSize(26),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale(20),
  },
  label: {
    color: '#fff',
    marginBottom: scale(4),
    fontWeight: 'bold',
    fontSize: responsiveFontSize(13),
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: scale(10),
    backgroundColor: '#fff',
  },
  message: {
    color: 'green',
    marginBottom: scale(10),
    textAlign: 'center',
    fontSize: responsiveFontSize(16),
  },
  optionButton: {
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD600',
    width: '48%',
  },
  optionButtonSelected: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },
  optionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(11),
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: '#181818',
  },
  finishButton: {
    backgroundColor: '#FFD600',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    // marginTop and marginBottom handled inline
  },
  finishButtonText: {
    color: '#181818',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(16),
    textAlign: 'center',
  },
});

export default QuestionnaireScreen; 