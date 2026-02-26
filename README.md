# Implicit Toxicity (Mispelled and Symbol Replaced) Detection in Sinhala (Unicode) Social Media Texts using Machine Learning Techniques

## 🔍 Overview
A research-driven project under development focused on detecting subtle, implicit toxicity in social media texts using advanced NLP and machine learning techniques. It aims to go beyond traditional toxicity detection by identifying hidden, context-dependent abusive language.
This research project is still under development which explores the detection of **Implicit toxicity in social Media Texts** using Natural Language Processing (NLP) and machine learning techniques. Unlike explicit abuse, implicit abuse is subtle, context-dependent, and often masked by sarcasm, euphemism, or coded language. Our goal is to develop a robust classifier that can identify such content with high precision and recall.

---

## 📚 Research Objectives

I.	   To create and pre-process a high-quality dataset of Sinhala implicit toxic and non-toxic comments from real social media platforms using standard NLP techniques.

II.	To design, develop, and train a machine learning model for detecting implicit toxic texts in Sinhala Unicode.

III.	To use context-based sentiment analysis for improving the accuracy of toxicity detection.

IV.	To evaluate the performance of the implemented model using appropriate metrics.

V. 	To build a web application of a social media platform named ‘HugHub’ for integrating the developed model for real-world detection of user-generated implicit toxic comments.



---

## 🧠 Methodology

<img width="886" height="498" alt="image" src="https://github.com/user-attachments/assets/268f24b9-2588-441f-8008-3cbd6550c001" />


In this research, a quantitative approach will be used, as it involves the collection, annotation, and analysis of large-scale Sinhala social media data using measurable, structured techniques. By applying machine learning algorithms and statistical evaluation methods, the study seeks to detect implicit toxic language patterns through objective, data-driven modeling

1. **Data Collection and annotation**

User-generated Sinhala comments were collected from widely used social media platforms, including Facebook, TikTok, YouTube, and Helakuru, as they represent major sources of user-generated Sinhala content. A total of 10,000 public comments were extracted from these platforms to capture diverse linguistic patterns, opinions, and interaction styles commonly found in Sinhala social media discourse.

The collected comments were manually reviewed, cleaned, and annotated to ensure data quality and relevance. Also, URLs and mentions were removed to safeguard users’ privacy and security. Each comment was labeled according to predefined toxicity categories (offensive, sexist, hateful, sarcastic, and racist) to support supervised learning and accurate model training. This structured and carefully prepared dataset provides a reliable foundation for developing and evaluating the proposed implicit toxic language classification system.
10000 user-generated texts included in this dataset (STOLA) are,
	5000 Healthy
	5000 Toxic

2. **Preprocessing**  

One of our main goals is to reduce the noise from user-generated texts and frame for improving the accuracy and reliability of implicit toxicity detection. Here we follow several main steps to achieve the goal.

Tokenization is the first and most important step in pre-processing user-generated texts, where raw text is broken into sentences and then into smaller parts called tokens, such as words or symbols, so that models can understand and analyze the text. After this, text cleaning is done to remove unnecessary parts like common words, very short words, mentions, and URLs in comments. Finally, stemming and lemmatization are used to handle different forms of the same toxic word, and stemming cuts words down to their basic form, while lemmatization changes words into their correct base or dictionary form, helping improve accuracy in text analysis and implicit toxicity detection in social media texts.

3. **Modeling**
 
Implicit Toxicity Detection Model is a Sinhala Unicode–based implicit toxicity detection transformer model that serves as the core intelligent component of the HugHub system. It analyzes text to identify hidden toxic content using machine learning, enabling accurate, automatic moderation and a safer communication environment for Sinhala-speaking users.
We have tried several approaches and proven the accuracy of predictions change according to the type of algorithm. Nearly 90% accuracy has been taken from finally trained XBERT  transformer model.


## 🤝 Contributors

**Instructor**
 :Miss.W.B.P.N.Herath
(Lecturer,Dep.of Computing,RUSL)

**Project leader**
 :P.A.W.Pelawaththa


V.A.P.Darshana

I.M.M.I.Marasingha

M.A.Shahani

I.D.Samarasingha


📬 Contact
For collaborations, feel free to reach out:
📧 wasanapelawaththasl@gmail.com
