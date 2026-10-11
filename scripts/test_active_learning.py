import os
import sys
import json
import torch
import pandas as pd
import numpy as np
import torch.nn.functional as F
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Sort-Waste")))
from src.dataset import CLASSES, get_transforms
from src.model import create_model

def run_active_learning_audit():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device.type.upper()}")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Sort-Waste"))
    model_path = os.path.join(base_dir, "models", "efficientnet_b0_best.pth")
    if not os.path.exists(model_path):
        model_path = os.path.join(base_dir, "models", "best_model.pth")

    model = create_model("efficientnet_b0", num_classes=10, pretrained=False)
    ckpt = torch.load(model_path, map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(device).eval()

    _, eval_tf = get_transforms(224)
    test_csv = os.path.join(base_dir, "data", "splits", "test.csv")
    df = pd.read_csv(test_csv)

    print(f"Loaded model from: {model_path}")
    print(f"Auditing first 150 samples from {test_csv} with Active Learning rules:")
    print(" - Least Confidence Threshold: Top-1 < 60% (0.60)")
    print(" - Margin Sampling Threshold: Margin (Top-1 - Top-2) < 15% (0.15)")
    print("=" * 95)

    flagged = []
    confident_count = 0

    for idx, row in df.head(150).iterrows():
        rel_path = os.path.join(base_dir, row["image_path"].lstrip("./"))
        if not os.path.exists(rel_path):
            continue
        
        with Image.open(rel_path) as img:
            rgb_img = img.convert("RGB")
        tensor = eval_tf(rgb_img).unsqueeze(0).to(device)

        with torch.no_grad():
            logits = model(tensor)
            probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        sorted_idx = probs.argsort()[::-1]
        top1_cls, p1 = CLASSES[sorted_idx[0]], float(probs[sorted_idx[0]])
        top2_cls, p2 = CLASSES[sorted_idx[1]], float(probs[sorted_idx[1]])
        margin = p1 - p2
        entropy = float(-np.sum(probs * np.log(probs + 1e-12)))

        is_least_conf = (p1 < 0.60)
        is_small_margin = (margin < 0.15)

        if is_least_conf or is_small_margin:
            reason = []
            if is_small_margin: reason.append(f"Small Margin ({margin*100:.1f}% < 15%)")
            if is_least_conf: reason.append(f"Low Conf ({p1*100:.1f}% < 60%)")
            flagged.append({
                "index": idx,
                "file": row["filename"],
                "true_class": row["class_name"],
                "top1": top1_cls,
                "p1": p1,
                "top2": top2_cls,
                "p2": p2,
                "margin": margin,
                "entropy": entropy,
                "reasons": " + ".join(reason)
            })
        else:
            confident_count += 1

    total_audited = confident_count + len(flagged)
    print(f"\nRESULTS ACROSS {total_audited} STREAM SAMPLES:")
    print(f" - Confident Sort (Direct Pneumatic Arm): {confident_count} ({confident_count/total_audited*100:.1f}%)")
    print(f" - Uncertain Flags (Diverted to Human-in-the-Loop): {len(flagged)} ({len(flagged)/total_audited*100:.1f}%)")
    print(f" - Manual Annotation Reduction: {(confident_count/total_audited)*100:.1f}% saved!\n")

    print(f"{'True Label':^10} | {'Top-1 Predicted':^16} | {'Top-2 Class':^16} | {'Margin':^8} | {'Entropy':^8} | {'HITL Routing Reason'}")
    print("-" * 95)
    for f in flagged[:8]:
        t1_str = f"{f['top1']} ({f['p1']*100:.1f}%)"
        t2_str = f"{f['top2']} ({f['p2']*100:.1f}%)"
        print(f"{f['true_class']:^10} | {t1_str:^16} | {t2_str:^16} | {f['margin']*100:^7.1f}% | {f['entropy']:^8.2f} | {f['reasons']}")
    print("=" * 95)

if __name__ == "__main__":
    run_active_learning_audit()
