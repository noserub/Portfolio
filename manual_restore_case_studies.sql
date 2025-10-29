-- Manual restore of missing case studies
-- Run this SQL directly in your Supabase SQL editor

-- First, let's check what we have
SELECT id, title, requires_password, password FROM projects;

-- Restore Skype Qik case study with password protection
INSERT INTO projects (
  id,
  user_id,
  title,
  description,
  url,
  position_x,
  position_y,
  scale,
  published,
  requires_password,
  password,
  case_study_content,
  case_study_images,
  flow_diagram_images,
  video_items,
  gallery_aspect_ratio,
  flow_diagram_aspect_ratio,
  video_aspect_ratio,
  gallery_columns,
  flow_diagram_columns,
  video_columns,
  project_images_position,
  videos_position,
  flow_diagrams_position,
  solution_cards_position,
  section_positions,
  sort_order
) VALUES (
  gen_random_uuid(),
  '7cd2752f-93c5-46e6-8535-32769fb10055',
  'Skype Qik case study',
  'Reimagining video communication for mobile',
  'data:image/jpeg;base64,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'...',
  50,
  50,
  1,
  true,
  true,
  '0p3n',
  '# Overview
Skype Qik was designed to reimagine video communication for a mobile-first era. As lead interaction designer and design lead on Skype''s "Tiger Team", I created an entirely new interaction model for video messaging—one that felt spontaneous, lightweight, and expressive.

Our mission was to create a mobile-first, modern video messaging app that removed barriers, encouraged self-expression, and aligned Skype with a new generation of users.

**The burden of traditional video calls**
Skype''s core product was designed for scheduled, synchronous video calls. But users—especially younger audiences—were moving toward instant, asynchronous platforms like Snapchat and Vine. Traditional calls felt awkward, heavy, and outdated:

* Scheduling friction created barriers
* Users wanted authentic, goofy, "in the moment" expression
* Calls lacked spontaneity, making video feel like a chore

# At a glance

**Platforms:** iOS, Android, Windows Phone

**Role:** Lead Interaction Designer & Design Lead

**Timeline:** 0–1 launch project, exploratory fast-paced experiment over 6 months

**Team:** Led a "Tiger Team" of 7 designers, researchers, and multiple engineering teams

---

# My role & impact

## Leadership

* Led design for a cross-platform release (iOS, Android, Windows Phone)
* Produced a single, comprehensive design spec with platform-specific notes
* Shaped the vision for a lightweight, mobile-first interaction model

## Design

* Created a persistent camera viewfinder for zero-friction capture
* Designed an immersive, horizontal video timeline conversation model
* Introduced a new industry interaction model, later validated by competitors like Marco Polo

## Research

* Conducted generative research with younger demographics
* Identified desire for authentic, bite-sized video bursts over long calls
# Impact

🚀 **First mobile app released by Skype** beyond its main client

🧩 **Functionality integrated into Skype** after Qik was sunsetted

🌍 **Pioneered a new asynchronous video conversation design pattern**

📈 **Model later adopted by other apps**, including Marco Polo

---

# Research insights

## Spontaneity drives authenticity

Users wanted quick, goofy clips—not scheduled video calls

## Always-ready camera reduces friction

A persistent viewfinder was essential for capturing real moments

## Clips create emotional response

Small, asynchronous bursts encouraged playful communication

## Lightweight > complex

Removing feeds and clutter kept focus on the conversation itself

---

# Competitive analysis

## Snapchat

Fun, disappearing messages, but ephemeral focus limited deeper conversations

## Vine

Great for creative clips, but not designed for back-and-forth interaction

## Periscope

Good for streaming and broadcasting video, but lacks the personality of 1-1 or small group interaction.

## Skype Qik

Positioned as a hybrid—personal, asynchronous video conversations designed for immediacy and expression

---

# The solution: Building a new kind of conversation

To bring the vision to life, I anchored the design in three principles

* Zero friction recording
* Immersive conversation model
* Fast, lightweight UI

# Top level / default view

We wanted the structure to be very lightweight and simple. We didn''t want a social feed or other features that distract from the primary goal of direct communication.

We wanted to leverage gestures to invoke the record state.

* Flick it down, the camera appears.
* Flick it up to scroll recent conversations.
* Tap on a conversation to view the video messages

The core screens include a top level view where video conversations are visible, a recording screen to capture the video, a conversation view to playback individual videos within the conversation.

# Business and consumer impact

## Consumer

✅ Delivered a new, expressive way to connect asynchronously

✅ Removed the "awkwardness" of traditional video calls

✅ Encouraged playful, authentic communication

## Business

✅ Positioned Skype as an innovator in mobile-first design

✅ Provided critical learnings about spontaneous video adoption

✅ Qik''s features were integrated into the broader Skype ecosystem

## Industry

✅ Established the asynchronous video conversation model and design pattern later adopted by apps like Marco Polo

✅ Validated the market need for lightweight, expressive video messaging

---

# Key takeaways

Skype Qik proved that video could be as spontaneous and effortless as texting.

The asynchronous conversation model my team designed reshaped how people thought about video messaging.

Designed for 3 platforms at once with a quick pace and successful product launch

I pioneered an interaction pattern that has since become standard across the industry.



# Conversation view
We considered a video timeline rather than a traditional vertically scrolling chat.
We tested both models and as it turned out, the horizontal video timeline model was also a great way of allowing the UI to be more conversational by allowing it be viewed like a movie.
<br>
We decided on using the horizontal video timeline model for the conversation view because it was a more engaging experience with less transitions and more focus on content.



# Recording
The camera / recording interface can be invoked by tapping on the affordance at the top of the view, or by using the swipe down gesture.

The camera used a countdown timer to indicate how much time is available for each video message.
',
  '[]',
  '[]',
  '[]',
  '3x4',
  '16x9',
  '16x9',
  2,
  1,
  1,
  1,
  999,
  998,
  1000,
  '{}',
  0
);

-- Restore Tandem Diabetes Care case study (without password protection)
INSERT INTO projects (
  id,
  user_id,
  title,
  description,
  url,
  position_x,
  position_y,
  scale,
  published,
  requires_password,
  password,
  case_study_content,
  case_study_images,
  flow_diagram_images,
  video_items,
  gallery_aspect_ratio,
  flow_diagram_aspect_ratio,
  video_aspect_ratio,
  gallery_columns,
  flow_diagram_columns,
  video_columns,
  project_images_position,
  videos_position,
  flow_diagrams_position,
  solution_cards_position,
  section_positions,
  sort_order
) VALUES (
  gen_random_uuid(),
  '7cd2752f-93c5-46e6-8535-32769fb10055',
  'Tandem Diabetes Care',
  'Designing the first touch screen insulin pump',
  '',
  50,
  50,
  1,
  true,
  false,
  '',
  '# Overview

As the first product designer at Tandem, I defined the UX and design strategy for the t:slim insulin pump, the first touchscreen insulin pump on the market. This FDA-cleared, award-winning device redefined design and usability in the diabetes tech industry and became Tandem''s flagship product, helping propel the company from startup to IPO.

**Mission**
* Deliver the industry''s first consumer-grade insulin pump interface
* Create a product that patients trust, understand, and want to use
* Reduce use errors while increasing training efficiency for clinicians
* Establish a design-driven culture inside a highly regulated, engineering-led organization

# Navigating the t:slim
- The primary functionality of the t:slim is delivering a bolus of insulin to the body to cover carbohydrate intake. As such, this is the primary action on the home screen.

- The Options menu provides additional functionality that is useful and convenient, but not primary to the core experience.

# My role & impact

## Leadership
* Hired and led Tandem''s first design team
* Collaborated with development to integrate UX into the Scrum process
* Built design frameworks, interactions, and processes from scratch
* Championed design strategy with executives, FDA, and clinical stakeholders

## Design
• Defined and executed the end-to-end UX for the t:slim product
* Created reusable UI patterns and interaction models for a medical-grade touchscreen device
* Worked closely with the FDA to ensure full compliance with FDA human factors (HE75) and safety guidelines
* Authored all product design documentation for a regulated industry

## Research
* Ethnographic studies
* Generative research
* Personas
* Usability testing with patients, nurses, and endocrinologists
• Analyze data and insights
# Impact

⭐ **Key metric 1:** Description

👉 **Key metric 2:** Description

🔄 **Key metric 3:** Description

💵 **Key metric 4:** Description

---

# At a glance

**Platform:** Custom software/hardware design

**Role:** Sr. UX Designer (17th employee, 1st designer)

**Timeline:** 3 year design cycle

**Team:** 2 designers, 1 user researcher, 1 prototyper; partnered with engineering

# Research insights

## Insight 1 headline

Description of the insight and why it matters.

## Insight 2 headline

Description of the insight and why it matters.

## Insight 3 headline

Description of the insight and why it matters.

(Add or remove ## sections as needed - each becomes a card)

---

# Competitive analysis

## Competitor 1

Description of competitor and key differentiators
• Feature 1
• Feature 2
• Limitation

## Competitor 2

Description of competitor and key differentiators
• Feature 1
• Feature 2
• Limitation

(Add or remove ## competitor sections as needed - each becomes a card)

---

# Key contributions
🧠 **Human-centered strategy in a regulated industry**
- Conducted deep stakeholder discovery with patients, nurses, endocrinologists, and execs
- Balanced human needs, safety protocols, and technical constraints in every design decision
- Created a custom interaction framework for a highly constrained mobil infusion pump

🔄 **Groundbreaking design in constrained hardware**
- Designed a touchscreen insulin delivery workflow that prioritized safety and clarity
- Developed reusable UI patterns that reduced development overhead and increased consistency
- Created Personal Profiles, a feature that reduced setup friction and improved patient outcomes
- Quick bolus function provided streamlined insulin delivery without the UI
- Extended bolus feature allows bolus to be incrementally delivered over time.
- Insulin on Board indicator provided critical information about how insulin is being used by the patient.

🔬 **Research-driven FDA compliance**
- Led formative research, personas, and ethnographic studies
- Collaborated with human factors and regulatory teams to meet FDA submission standards
- Ran extensive usability testing with Type 1 Diabetes patients and clinical educators
- Delivered a system that passed summative testing with minimal revisions

💼 **Enterprise impact**
- t:slim became Tandem''s flagship product, directly contributing to company growth and IPO
- UX foundation I established is still in use across current Tandem product lines
- Helped Tandem compete with and surpass legacy players in usability and innovation perception
- Product received multiple industry awards, becoming a new standard in diabetes tech



# Key features

## Insulin onboard indicator

This allowed patients to understand how much insulin is in their system based on their most recent meal, considering their blood glucose level, insulin to carb ratio, and current basal rate.

## Touch screen keypad 

Allows direct manipulation and entry of values for blood glucose, bolus calculations, and settings like the insulin to carb ratio. Competitor products required scrolling through a list of values before selecting one

## Extended bolus

Allowed a bolus to be delivered over a period of time to account for situations like snacking over a long period vs dedicated meals.

## Quick bolus

Allowed a bolus to be delivered without looking at the screen based on gestures using a single hardware button.

## Personal profiles

Allowed patients to fully customize their insulin settings for different situations, such as high / low energy activities, work, sickness, etc.



# Delivering a bolus
- A bolus is an injection of insulin to the body. The Bolus features in the t:slim allowed users to enter the amount of carbohydrates they plan to eat, and the pump would automatically calculate the appropriate dose based on your insulin to carbohydrate ratio.

- If the patient adds a blood glucose value, the insulin dose accounts for a high or low reading, which could restrict the amount included in the dose as a safety precaution.



# Personal profiles 
The personal profiles features enabled very quick training and onboarding for both nurse educators and patients by providing presets for times of day, activities, or other situations requiring an altered basal dose of insulin.',
  '[]',
  '[]',
  '[{"id":"y0paw7jjy","url":"https://youtu.be/tqnjNOqxk4M","type":"youtube"},{"id":"jmpzj5mqo","url":"https://youtu.be/9Gu6h4OiR5E","type":"youtube"},{"id":"08qmwpik9","url":"https://www.youtube.com/watch?v=OpsxpDXGmPo","type":"youtube"}]',
  '3x4',
  '16x9',
  '16x9',
  3,
  2,
  1,
  1,
  998,
  1000,
  '{"__AT_A_GLANCE__":0,"Overview":1,"__IMPACT__":2,"My role":3,"The Solution":4,"__PROJECT_IMAGES__":5,"__SOLUTION_CARDS__":6,"__FLOW_DIAGRAMS__":7}',
  998,
  '{}',
  0
);

-- Verify the restore worked
SELECT id, title, requires_password, password FROM projects ORDER BY title;

