// Вариант 22. Покрасочная камера. Контроль паров краски, освещённости и давления воздуха
// Плата: Arduino Uno (ATmega328P), симулятор Wokwi
// Подключение:
//   Датчик 1 (MQ2, пары краски 0-100 %)          -> A0 (вывод AOUT)
//   Датчик 2 (LDR, освещённость 0-100 %)         -> A1 (вывод AO)
//   Датчик 3 (POT, давление воздуха 0-10 бар)    -> A2
//   Зуммер HA1                                    -> D8
//   Светодиод HL1 (жёлтый) через R1 = 300 Ом      -> D7

const int PIN_S1 = A0;      // датчик 1: MQ2 (пары краски)
const int PIN_S2 = A1;      // датчик 2: LDR (освещённость)
const int PIN_S3 = A2;      // датчик 3: POT (давление воздуха)
const int PIN_BUZZER = 8;   // зуммер
const int PIN_LED = 7;      // светодиод-индикатор

const unsigned long T_MS = 2000;  // период опроса T = 2 с
const float S1_MIN = 0.0;         // диапазон датчика 1: 0...100 %
const float S1_MAX = 100.0;
const float S2_MIN = 0.0;         // диапазон датчика 2: 0...100 % (по умолчанию для LDR)
const float S2_MAX = 100.0;
const float S3_MIN = 0.0;         // диапазон датчика 3: 0...10 бар
const float S3_MAX = 10.0;
const float THRESHOLD = 35.0;     // порог: пары краски > 35 %
const unsigned int BUZZER_HZ = 1000;

unsigned long n = 0;   // номер измерения
bool alarm = false;    // порог сейчас превышен?

// Датчик 1: MQ2 (пары краски, %)
float readS1() {
  return S1_MIN + (S1_MAX - S1_MIN) * analogRead(PIN_S1) / 1023.0;
}

// Датчик 2: LDR (освещённость, %)
float readS2() {
  return S2_MIN + (S2_MAX - S2_MIN) * analogRead(PIN_S2) / 1023.0;
}

// Датчик 3: POT (давление воздуха, бар)
float readS3() {
  return S3_MIN + (S3_MAX - S3_MIN) * analogRead(PIN_S3) / 1023.0;
}

void actuatorOn() {
  tone(PIN_BUZZER, BUZZER_HZ);   // зуммер звучит непрерывно
}

void actuatorOff() {
  noTone(PIN_BUZZER);
}

bool conditionMet(float s1, float s2, float s3) {
  return s1 > THRESHOLD;
}

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  actuatorOff();
  digitalWrite(PIN_LED, LOW);
}

void loop() {
  n++;

  float s1 = readS1();
  float s2 = readS2();
  float s3 = readS3();

  Serial.print("DATA n=");  Serial.print(n);
  Serial.print(" s1=");     Serial.print(s1, 1);
  Serial.print(" s2=");     Serial.print(s2, 1);
  Serial.print(" s3=");     Serial.println(s3, 2);

  bool cond = conditionMet(s1, s2, s3);
  if (cond && !alarm) {
    alarm = true;
    actuatorOn();
    digitalWrite(PIN_LED, HIGH);
    Serial.print("EVENT n="); Serial.print(n);
    Serial.println(" type=THRESHOLD");
  } else if (!cond && alarm) {
    alarm = false;
    actuatorOff();
    digitalWrite(PIN_LED, LOW);
    Serial.print("EVENT n="); Serial.print(n);
    Serial.println(" type=NORMAL");
  }

  delay(T_MS);
}
