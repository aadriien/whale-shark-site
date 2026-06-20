import{j as t}from"./index-BpaeRH9L.js";const d=({shark:s,onPlayStory:n,isPlaying:r,playingSharkId:a,showPauseForGeoLabs:l=!1,onToggleStepMode:i,isStepMode:c=!1})=>s?l?t.jsx("div",{className:"play-story-section",children:t.jsx("button",{className:`geo-labs-step-button
                        ${c?" step-mode-active":""}
                    `,onClick:e=>{e.stopPropagation(),i==null||i()},children:c?"Exit Story Mode":t.jsxs(t.Fragment,{children:["Step Through ",t.jsx("strong",{children:s.name||s.id}),"'s Story"]})})}):t.jsx("div",{className:"play-story-section",children:t.jsx("button",{className:`play-story-button
                    ${a===s.id&&r?" currentlyPlaying":""}
                    ${r?" anyPlaying":""}
                `,onClick:e=>{e.stopPropagation(),n==null||n(s.id)},disabled:r,children:r?"Story in Progress...":t.jsxs(t.Fragment,{children:["Play ",t.jsx("strong",{children:s.name||s.id}),"'s Story"]})})}):null;export{d as P};
