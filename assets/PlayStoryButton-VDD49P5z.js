import{j as t}from"./index-W2mpsWUc.js";const d=({shark:o,onPlayStory:r,isPlaying:e,playingSharkId:l,showPauseForGeoLabs:i=!1,onToggleStepMode:a,isStepMode:s=!1})=>o?i?t.jsx("div",{className:"play-story-section",children:t.jsx("button",{className:`geo-labs-step-button
                        ${s?" step-mode-active":""}
                    `,onClick:n=>{n.stopPropagation(),a()},children:s?"Exit Story Mode":t.jsxs(t.Fragment,{children:["Step Through ",t.jsx("strong",{children:o.name||o.id}),"'s Story"]})})}):t.jsx("div",{className:"play-story-section",children:t.jsx("button",{className:`play-story-button
                    ${l===o.id&&e?" currentlyPlaying":""}
                    ${e?" anyPlaying":""}
                `,onClick:n=>{n.stopPropagation(),r(o.id)},disabled:e,children:e?"Story in Progress...":t.jsxs(t.Fragment,{children:["Play ",t.jsx("strong",{children:o.name||o.id}),"'s Story"]})})}):null;export{d as P};
