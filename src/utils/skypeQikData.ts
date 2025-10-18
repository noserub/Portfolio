export const skypeQikCaseStudy = {
  id: "cs-3",
  url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
  title: "Reimagining video communication for mobile",
  description: "Skype Qik case study",
  position: { x: 50, y: 50 },
  scale: 1,
  published: true,
  caseStudyContent: `# Overview

Skype Qik was designed to reimagine video communication for a mobile-first era. As lead interaction designer and design lead on Skype's "Tiger Team", I created an entirely new interaction model for video messaging—one that felt spontaneous, lightweight, and expressive.

# The mission

Our mission was to create a mobile-first, modern video messaging app that removed barriers, encouraged self-expression, and aligned Skype with a new generation of users.

# At a glance

**Platforms:** iOS, Android, Windows Phone

**Role:** Lead Interaction Designer & Design Lead

**Timeline:** 0–1 launch project, exploratory fast-paced experiment over 6 months

**Team:** Led a "Tiger Team" of 7 designers, researchers, and multiple engineering teams across 3 mobile platforms

---

# The challenge

## The burden of traditional video calls

Skype's core product was designed for scheduled, synchronous video calls. But users—especially younger audiences—were moving toward instant, asynchronous platforms like Snapchat and Vine. Traditional calls felt awkward, heavy, and outdated:

* Scheduling friction created barriers
* Users wanted authentic, goofy, "in the moment" expression
* Calls lacked spontaneity, making video feel like a chore

## Challenge statement

How could Skype reinvent video communication to feel as effortless as a text message?

---

# My role & impact

## Leadership

* Led design for a cross-platform release (iOS, Android, Windows Phone)
* Produced a single, comprehensive design spec with platform-specific notes
* Shaped the vision for a lightweight, mobile-first interaction model

## Design & research

* Conducted generative research with younger demographics
* Identified desire for authentic, bite-sized video bursts over long calls
* Created a persistent camera viewfinder for zero-friction capture
* Designed an immersive, horizontal video timeline conversation model
* Introduced a new industry interaction model, later validated by competitors like Marco Polo

## Impact

* Delivered a fast, expressive app experience that influenced Microsoft's product roadmap
* Advanced professional growth as a design leader and innovator in real-time communication responsible for a product launch across multiple operating systems

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

To bring the vision to life, I anchored the design in three principles: zero-friction recording, an immersive conversation model, and a lightweight UI that kept focus on human connection.

---

# Solution highlights

## Zero-friction recording

Persistent viewfinder enabled instant capture without friction.

## Immersive conversation model

Horizontal timeline created dynamic, emotional interactions.

## Lightweight UI

Stripped clutter to focus on authentic human connection.

---

# Design

## Top level / default view

We wanted the structure to be very lightweight and simple. We didn't want a social feed or other features that distract from the primary goal of direct communication.

We wanted to leverage gestures to invoke the record state.

* Flick it down, the camera appears.
* Flick it up to scroll recent conversations.
* Tap on a conversation to view the video messages

The core screens include a top level view where video conversations are visible, a recording screen to capture the video, a conversation view to playback individual videos within the conversation.

## Conversation view

For the conversation view, we considered a video timeline rather than a traditional vertically scrolling chat.

We tested both models and as it turned out, the horizontal video timeline model was also a great way of allowing the UI to be more conversational by allowing it be viewed like a movie.

We decided on using the horizontal video timeline model for the conversation view because it was a more engaging experience with less transitions and more focus on content.

## Recording

The camera / recording interface can be invoked by tapping on the affordance at the top of the view, or by using the swipe down gesture.

The camera used a countdown timer to indicate how much time is available for each video message.

---

# Business and consumer impact

## Consumer

✅ Delivered a new, expressive way to connect asynchronously

✅ Removed the "awkwardness" of traditional video calls

✅ Encouraged playful, authentic communication

## Business

✅ Positioned Skype as an innovator in mobile-first design

✅ Provided critical learnings about spontaneous video adoption

✅ Qik's features were integrated into the broader Skype ecosystem

## Industry

✅ Established the asynchronous video conversation model and design pattern later adopted by apps like Marco Polo

✅ Validated the market need for lightweight, expressive video messaging

---

# Key takeaways

Skype Qik proved that video could be as spontaneous and effortless as texting.

The asynchronous conversation model my team designed reshaped how people thought about video messaging.

Designed for 3 platforms at once with a quick pace and successful product launch

I pioneered an interaction pattern that has since become standard across the industry.`,
  caseStudyImages: [
    {
      id: "qik-top-level",
      url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
      alt: "Top level view"
    },
    {
      id: "qik-recording",
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
      alt: "Recording video"
    },
    {
      id: "qik-conversation",
      url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
      alt: "Conversation view"
    },
    {
      id: "qik-early-concept",
      url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800",
      alt: "Early concept for recording"
    },
    {
      id: "qik-iteration",
      url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
      alt: "Another early iteration of recording"
    },
    {
      id: "qik-notifications",
      url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
      alt: "Notifications"
    },
    {
      id: "qik-sms-invite",
      url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
      alt: "SMS invite dialog"
    }
  ]
};
