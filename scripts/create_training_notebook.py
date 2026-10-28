"""
Script to generate the complete, self-contained Smart_Waste_Sorter_Training.ipynb
with full data preprocessing, augmentation, Two-Stage Transfer Learning on EfficientNet-B0,
evaluation metrics, and PyTorch Grad-CAM explainability.
"""

import json
import os

notebook = {
    "cells": [],
    "metadata": {
        "accelerator": "GPU",
        "colab": {
            "name": "Smart_Waste_Sorter_Training.ipynb",
            "provenance": [],
            "toc_visible": True
        },
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.10.12"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 5
}

def add_md(source):
    notebook["cells"].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source.strip().split("\n")]
    })

def add_code(source):
    notebook["cells"].append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source.strip().split("\n")]
    })

# ---------------------------------------------------------------------------
# CELL 1: Header Markdown
# ---------------------------------------------------------------------------
add_md("""# Smart Waste Sorter AI — End-to-End Model Training Pipeline
### Deep Learning, Data Augmentation & Two-Stage Transfer Learning with Explainable AI (Grad-CAM)
**Engineered by Kapate Consultancy Applied AI Lab**

---

### 📌 Notebook Overview & Architecture
This notebook implements the complete, production-grade training pipeline for the **Smart Waste Sorter AI** system. The platform classifies solid waste streams into **10 standard municipal classes**:
- `cardboard`, `glass`, `metal`, `paper`, `plastic`, `textile`, `organic`, `trash`, `battery`, `vegetation`

#### 🔬 Key Engineering Pillars:
1. **Data Hygiene & Preprocessing**:
   - Stratified **70% Train / 15% Validation / 15% Test** partition to prevent data leakage.
   - Class-imbalance mitigation via inverse-frequency class weighting and label smoothing ($0.05$).
2. **Domain-Specific Data Augmentation**:
   - `RandomResizedCrop(224, scale=(0.8, 1.0))` for scale invariance.
   - `RandomHorizontalFlip` and `RandomRotation(degrees=15)` for spatial angle invariance.
   - `ColorJitter` for illumination robustness across variable sorting facility and outdoor ambient lighting.
   - ImageNet normalization: `mean=[0.485, 0.456, 0.406]`, `std=[0.229, 0.224, 0.225]`.
3. **Two-Stage Transfer Learning Strategy**:
   - **Stage 1 (Feature Extraction)**: Freeze backbone features (`features`), train custom classification head (`Linear(1280, 10)` + Dropout `0.3`) for 5 epochs with higher learning rate ($10^{-3}$).
   - **Stage 2 (Fine-Tuning)**: Unfreeze all layers, train end-to-end with low learning rate ($5 \\times 10^{-5}$) and Cosine Annealing learning rate schedule.
4. **Accelerated FP16 Mixed Precision**:
   - PyTorch `torch.amp.autocast('cuda')` and `torch.amp.GradScaler('cuda')` for memory efficiency and sub-5ms GPU execution.
5. **Explainable AI (XAI)**:
   - PyTorch Gradient-weighted Class Activation Mapping (**Grad-CAM**) forward and backward tensor hooks on the final convolutional block (`model.features[-1]`) to verify transparent saliency attribution.
""")

# ---------------------------------------------------------------------------
# CELL 2: Dependencies Installation
# ---------------------------------------------------------------------------
add_md("""## 1. Install & Import Dependencies""")
add_code("""# Install required packages if running on Google Colab or Kaggle
!pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
!pip install -q scikit-learn pandas numpy matplotlib seaborn pillow opencv-python tqdm

import os
import sys
import time
import math
import glob
import json
import random
from io import BytesIO
from typing import Tuple, List, Dict

import cv2
import numpy as np
import pandas as pd
from PIL import Image
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm.auto import tqdm

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# Set random seed for complete reproducibility
def seed_everything(seed=42):
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

seed_everything(42)
print("All dependencies imported successfully!")
""")

# ---------------------------------------------------------------------------
# CELL 3: Hardware Verification
# ---------------------------------------------------------------------------
add_md("""## 2. Hardware & Runtime Verification""")
add_code("""# Verify GPU environment and VRAM availability
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("=" * 65)
print("COMPUTE ENVIRONMENT SPECIFICATIONS")
print("=" * 65)
print(f"Device Type:         {DEVICE.type.upper()}")
print(f"PyTorch Version:     {torch.__version__}")

if DEVICE.type == "cuda":
    gpu_name = torch.cuda.get_device_name(0)
    total_mem = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    print(f"GPU Model:           {gpu_name}")
    print(f"Total VRAM:          {total_mem:.2f} GB")
    print(f"CUDA Capability:     {torch.cuda.get_device_capability(0)}")
    print(f"AMP FP16 Supported:  True")
else:
    print("GPU Model:           N/A (CPU Mode)")
    print("Note: CUDA GPU is highly recommended for faster training.")
print("=" * 65)
""")

# ---------------------------------------------------------------------------
# CELL 4: Class Definitions
# ---------------------------------------------------------------------------
add_md("""## 3. Dataset Classes & Hierarchy Specification
The dataset contains 10 unified solid waste classes spanning municipal, industrial, electronic, and organic streams.""")
add_code("""# 10 Unified Target Waste Streams
CLASSES = [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic",
    "textile",
    "organic",
    "trash",
    "battery",
    "vegetation"
]

CLASS_TO_IDX = {cls_name: i for i, cls_name in enumerate(CLASSES)}
IDX_TO_CLASS = {i: cls_name for i, cls_name in enumerate(CLASSES)}
NUM_CLASSES = len(CLASSES)

print(f"Configured {NUM_CLASSES} Target Waste Classes:")
for idx, name in IDX_TO_CLASS.items():
    print(f"  [{idx}] {name}")
""")

# ---------------------------------------------------------------------------
# CELL 5: Preprocessing & Data Augmentation Pipelines
# ---------------------------------------------------------------------------
add_md("""## 4. Preprocessing & Data Augmentation Pipeline

### 🧪 Preprocessing Rationale:
- **Training Pipeline**:
  - `RandomResizedCrop(224, scale=(0.8, 1.0))`: Simulates conveyor camera distance variations and occlusions.
  - `RandomHorizontalFlip(p=0.5)`: Preserves waste object geometry while doubling lateral orientation samples.
  - `RandomRotation(degrees=15)`: Handles angular skew on sorting conveyor belts.
  - `ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05)`: Accounts for plant lighting, surface glare on plastics/glass, and shadow gradients.
  - `Normalize`: ImageNet canonical distribution scaling ($Z = \\frac{X - \\mu}{\\sigma}$).
- **Validation & Test Pipeline**:
  - Deterministic evaluation: `Resize(256)` followed by `CenterCrop(224)` and `Normalize`.
  - Zero randomized augmentations to preserve strict evaluation reproducibility.
""")

add_code("""# ImageNet standard statistics
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
IMG_SIZE = 224

def get_transforms(img_size=IMG_SIZE):
    \"\"\"
    Build training and validation/test transformation pipelines.
    \"\"\"
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])

    eval_transform = transforms.Compose([
        transforms.Resize(int(img_size * 256 / 224)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])

    return train_transform, eval_transform

train_transforms, eval_transforms = get_transforms(IMG_SIZE)
print("Transformations initialized successfully!")
print("Train transforms:\n", train_transforms)
print("\\nEval transforms:\n", eval_transforms)
""")

# ---------------------------------------------------------------------------
# CELL 6: Dataset Class & Split Creation
# ---------------------------------------------------------------------------
add_md("""## 5. Dataset Loader & Stratified Split Engine
Ensures zero data leakage between train, validation, and holdout test partitions.""")
add_code("""class WasteDataset(Dataset):
    \"\"\"
    PyTorch Dataset with robust error handling for RGB waste images.
    \"\"\"
    def __init__(self, df: pd.DataFrame, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row["filepath"]
        label_idx = row["label_idx"]

        try:
            image = Image.open(img_path).convert("RGB")
        except Exception as e:
            # Fallback for corrupted image files
            print(f"Warning: Corrupted image {img_path}, using blank fallback.")
            image = Image.new("RGB", (IMG_SIZE, IMG_SIZE), color=(128, 128, 128))

        if self.transform is not None:
            image = self.transform(image)

        return image, torch.tensor(label_idx, dtype=torch.long)


def prepare_dataset_splits(data_root="dataset", seed=42):
    \"\"\"
    Scans dataset folder or creates synthetic test splits if local data is not yet downloaded.
    \"\"\"
    records = []
    
    # Check if a folder structure dataset exists
    if os.path.isdir(data_root):
        for cls_name in CLASSES:
            cls_folder = os.path.join(data_root, cls_name)
            if os.path.isdir(cls_folder):
                for fname in sorted(os.listdir(cls_folder)):
                    if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                        records.append({
                            "filepath": os.path.join(cls_folder, fname),
                            "label": cls_name,
                            "label_idx": CLASS_TO_IDX[cls_name]
                        })

    # If dataset folder is not present, generate demonstration records or load from splits
    if len(records) == 0:
        print(f"Notice: Directory '{data_root}' not found. Generating sample records for demonstration...")
        os.makedirs("demo_data", exist_ok=True)
        for cls_name in CLASSES:
            cls_dir = os.path.join("demo_data", cls_name)
            os.makedirs(cls_dir, exist_ok=True)
            for i in range(15):
                sample_img_path = os.path.join(cls_dir, f"sample_{i}.jpg")
                if not os.path.exists(sample_img_path):
                    # Create synthetic RGB swatch
                    color = (random.randint(40, 220), random.randint(40, 220), random.randint(40, 220))
                    dummy = Image.new("RGB", (224, 224), color=color)
                    dummy.save(sample_img_path)
                records.append({
                    "filepath": sample_img_path,
                    "label": cls_name,
                    "label_idx": CLASS_TO_IDX[cls_name]
                })

    df = pd.DataFrame(records)
    print(f"Total verified image records: {len(df)}")
    print(df["label"].value_counts())

    # Stratified 70% Train, 15% Val, 15% Test
    train_df, temp_df = train_test_split(
        df, test_size=0.30, random_state=seed, stratify=df["label_idx"]
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, random_state=seed, stratify=temp_df["label_idx"]
    )

    print(f"\\nSplit Breakdown:")
    print(f"  Training Set:   {len(train_df):,} samples ({len(train_df)/len(df)*100:.1f}%)")
    print(f"  Validation Set: {len(val_df):,} samples ({len(val_df)/len(df)*100:.1f}%)")
    print(f"  Test Set:       {len(test_df):,} samples ({len(test_df)/len(df)*100:.1f}%)")

    return train_df, val_df, test_df

# Generate or load splits
train_df, val_df, test_df = prepare_dataset_splits(data_root="dataset")
""")

# ---------------------------------------------------------------------------
# CELL 7: Inverse Frequency Class Weights & DataLoaders
# ---------------------------------------------------------------------------
add_md("""## 6. Class Imbalance Mitigation (Inverse Class Weighting)
Computes inverse frequency loss weights on the training split only to avoid bias.""")
add_code("""def compute_class_weights(df: pd.DataFrame) -> torch.Tensor:
    \"\"\"
    Compute inverse frequency class weights to balance CrossEntropyLoss.
    Formula: weight[c] = total_samples / (num_classes * count[c])
    \"\"\"
    counts = df["label_idx"].value_counts().sort_index().values
    total_samples = len(df)
    num_classes = len(counts)
    weights = total_samples / (num_classes * counts.astype(np.float32))
    # Normalize weights so mean is 1.0
    weights = weights / weights.mean()
    return torch.tensor(weights, dtype=torch.float32)

class_weights = compute_class_weights(train_df).to(DEVICE)
print("Computed Class Balancing Weights:")
for idx, cls_name in enumerate(CLASSES):
    print(f"  {cls_name:<12}: {class_weights[idx].item():.3f}")

# Instantiate PyTorch Datasets & DataLoaders
train_dataset = WasteDataset(train_df, transform=train_transforms)
val_dataset = WasteDataset(val_df, transform=eval_transforms)
test_dataset = WasteDataset(test_df, transform=eval_transforms)

BATCH_SIZE = 16 if DEVICE.type == "cuda" else 8
NUM_WORKERS = 2 if os.name != 'nt' else 0

train_loader = DataLoader(
    train_dataset, batch_size=BATCH_SIZE, shuffle=True,
    num_workers=NUM_WORKERS, pin_memory=(DEVICE.type == "cuda")
)
val_loader = DataLoader(
    val_dataset, batch_size=BATCH_SIZE, shuffle=False,
    num_workers=NUM_WORKERS, pin_memory=(DEVICE.type == "cuda")
)
test_loader = DataLoader(
    test_dataset, batch_size=BATCH_SIZE, shuffle=False,
    num_workers=NUM_WORKERS, pin_memory=(DEVICE.type == "cuda")
)

print(f"\\nDataLoaders created with batch_size={BATCH_SIZE}")
""")

# ---------------------------------------------------------------------------
# CELL 8: Visualizing Augmented Samples
# ---------------------------------------------------------------------------
add_md("""## 7. Visualize Data Augmentations in Action
Inspect the normalized and un-normalized augmented images.""")
add_code("""def denormalize(tensor, mean=IMAGENET_MEAN, std=IMAGENET_STD):
    \"\"\"Reverse ImageNet normalization for visualization.\"\"\"
    t = tensor.clone()
    for channel, m, s in zip(t, mean, std):
        channel.mul_(s).add_(m)
    return torch.clamp(t, 0, 1)

# Grab a batch and plot
dataiter = iter(train_loader)
images, labels = next(dataiter)

plt.figure(figsize=(14, 6))
num_to_show = min(8, len(images))
for i in range(num_to_show):
    plt.subplot(2, 4, i + 1)
    img_disp = denormalize(images[i]).permute(1, 2, 0).numpy()
    plt.imshow(img_disp)
    plt.title(f"{CLASSES[labels[i]]}", fontsize=11, fontweight="bold")
    plt.axis("off")

plt.suptitle("Augmented Training Samples (Scale, Rotation, ColorJitter)", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.show()
""")

# ---------------------------------------------------------------------------
# CELL 9: Model Architecture
# ---------------------------------------------------------------------------
add_md("""## 8. Model Architecture & Linear Classification Head
Using `EfficientNet-B0` with ImageNet pretrained weights. The compound-scaled backbone provides superior parameter efficiency (5.3M parameters) and sub-5ms inference latency.""")
add_code("""def create_waste_classifier(model_name="efficientnet_b0", num_classes=10, dropout=0.3):
    \"\"\"
    Instantiate model with ImageNet weights and replace classification head.
    \"\"\"
    if model_name.lower() == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.DEFAULT
        model = models.efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        # Replace 1000-class ImageNet head with customized 10-class Head
        model.classifier = nn.Sequential(
            nn.Dropout(p=dropout, inplace=True),
            nn.Linear(in_features, num_classes)
        )
    elif model_name.lower() == "resnet50":
        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes)
        )
    else:
        raise ValueError(f"Unsupported architecture: {model_name}")

    return model

model = create_waste_classifier("efficientnet_b0", num_classes=NUM_CLASSES, dropout=0.3).to(DEVICE)
total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)

print("=" * 65)
print("EFFICIENTNET-B0 MODEL ARCHITECTURE")
print("=" * 65)
print(f"Total Parameters:      {total_params:,}")
print(f"Trainable Parameters:  {trainable_params:,}")
print("Classification Head:\\n", model.classifier)
print("=" * 65)
""")

# ---------------------------------------------------------------------------
# CELL 10: Training Helper Functions
# ---------------------------------------------------------------------------
add_md("""## 9. Training & Validation Execution Loops (AMP FP16)""")
add_code("""def run_epoch(model, loader, criterion, optimizer, scaler, device, is_train=True):
    \"\"\"
    Execute one full pass over DataLoader with PyTorch AMP FP16.
    \"\"\"
    if is_train:
        model.train()
    else:
        model.eval()

    running_loss = 0.0
    all_preds = []
    all_targets = []
    use_amp = (device.type == "cuda")

    context = torch.enable_grad() if is_train else torch.no_grad()
    with context:
        for images, targets in loader:
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)

            if is_train:
                optimizer.zero_grad(set_to_none=True)

            with torch.amp.autocast("cuda", enabled=use_amp):
                outputs = model(images)
                loss = criterion(outputs, targets)

            if is_train:
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

            running_loss += loss.item() * images.size(0)
            preds = torch.argmax(outputs, dim=1).detach().cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(targets.cpu().numpy())

    epoch_loss = running_loss / len(all_targets)
    epoch_acc = accuracy_score(all_targets, all_preds)
    epoch_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0)
    return epoch_loss, epoch_acc, epoch_f1

def freeze_backbone(model):
    \"\"\"Freeze backbone feature layers; only classifier head trains.\"\"\"
    for param in model.features.parameters():
        param.requires_grad = False
    for param in model.classifier.parameters():
        param.requires_grad = True

def unfreeze_all(model):
    \"\"\"Unfreeze all layers for end-to-end fine tuning.\"\"\"
    for param in model.parameters():
        param.requires_grad = True

print("Training execution functions registered.")
""")

# ---------------------------------------------------------------------------
# CELL 11: Two-Stage Training Execution
# ---------------------------------------------------------------------------
add_md("""## 10. Execute Two-Stage Transfer Learning

#### 🚀 Stage 1: Linear Classification Head Warmup (5 Epochs)
- Backbone features are frozen.
- Trains only the custom classification head with AdamW ($LR=10^{-3}$, weight decay $=10^{-4}$).
- Prevents catastrophic disruption of pretrained ImageNet spatial representations.

#### 🎯 Stage 2: End-to-End Fine-Tuning (25 Epochs)
- All layers unfrozen.
- Lower initial learning rate ($5 \\times 10^{-5}$) with **Cosine Annealing decay** down to $10^{-7}$.
- Checkpoints saved whenever **Validation Macro F1** reaches a new high.
""")

add_code("""# Hyperparameters
STAGE1_EPOCHS = 5
STAGE2_EPOCHS = 25
STAGE1_LR = 1e-3
STAGE2_LR = 5e-5
WEIGHT_DECAY = 1e-4
LABEL_SMOOTHING = 0.05
PATIENCE = 7

# Loss function with class weights & label smoothing
criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=LABEL_SMOOTHING)
scaler = torch.amp.GradScaler("cuda", enabled=(DEVICE.type == "cuda"))

history = []
best_val_macro_f1 = -1.0
best_epoch = 0
patience_counter = 0

os.makedirs("checkpoints", exist_ok=True)
best_model_path = "checkpoints/smart_waste_sorter_best.pth"

# ==============================================================================
# STAGE 1: Feature Extraction
# ==============================================================================
print("\\n" + "=" * 90)
print(f"STAGE 1: Feature Extraction — Training Classifier Head Only ({STAGE1_EPOCHS} Epochs, LR={STAGE1_LR})")
print("=" * 90)
freeze_backbone(model)

optimizer_stage1 = torch.optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=STAGE1_LR,
    weight_decay=WEIGHT_DECAY
)
scheduler_stage1 = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer_stage1, T_max=STAGE1_EPOCHS, eta_min=1e-5
)

print(f"{'Stage':^7} | {'Epoch':^7} | {'Train Loss':^11} | {'Val Loss':^11} | {'Train Acc':^11} | {'Val Acc':^11} | {'Train F1':^11} | {'Val F1':^11} | {'LR':^10} | {'Status':^12}")
print("-" * 115)

global_epoch = 0
for epoch in range(1, STAGE1_EPOCHS + 1):
    global_epoch += 1
    lr = optimizer_stage1.param_groups[0]["lr"]
    tr_loss, tr_acc, tr_f1 = run_epoch(model, train_loader, criterion, optimizer_stage1, scaler, DEVICE, is_train=True)
    vl_loss, vl_acc, vl_f1 = run_epoch(model, val_loader, criterion, optimizer_stage1, scaler, DEVICE, is_train=False)
    scheduler_stage1.step()

    status = "-"
    if vl_f1 > best_val_macro_f1:
        best_val_macro_f1 = vl_f1
        best_epoch = global_epoch
        status = "BEST (Saved)"
        torch.save({
            "epoch": global_epoch,
            "model_state_dict": model.state_dict(),
            "val_macro_f1": vl_f1,
            "val_accuracy": vl_acc,
            "classes": CLASSES
        }, best_model_path)

    history.append({
        "stage": 1, "epoch": global_epoch,
        "train_loss": tr_loss, "val_loss": vl_loss,
        "train_acc": tr_acc, "val_acc": vl_acc,
        "train_f1": tr_f1, "val_f1": vl_f1,
        "lr": lr
    })

    print(f"{'Stage 1':^7} | {global_epoch:^7} | {tr_loss:^11.4f} | {vl_loss:^11.4f} | {tr_acc*100:^10.2f}% | {vl_acc*100:^10.2f}% | {tr_f1:^11.4f} | {vl_f1:^11.4f} | {lr:^10.6f} | {status:^12}")

# ==============================================================================
# STAGE 2: End-to-End Fine-Tuning
# ==============================================================================
print("\\n" + "=" * 90)
print(f"STAGE 2: End-to-End Fine-Tuning Backbone ({STAGE2_EPOCHS} Epochs, LR={STAGE2_LR})")
print("=" * 90)
unfreeze_all(model)

optimizer_stage2 = torch.optim.AdamW(
    model.parameters(),
    lr=STAGE2_LR,
    weight_decay=WEIGHT_DECAY
)
scheduler_stage2 = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer_stage2, T_max=STAGE2_EPOCHS, eta_min=1e-7
)

for epoch in range(1, STAGE2_EPOCHS + 1):
    global_epoch += 1
    lr = optimizer_stage2.param_groups[0]["lr"]
    tr_loss, tr_acc, tr_f1 = run_epoch(model, train_loader, criterion, optimizer_stage2, scaler, DEVICE, is_train=True)
    vl_loss, vl_acc, vl_f1 = run_epoch(model, val_loader, criterion, optimizer_stage2, scaler, DEVICE, is_train=False)
    scheduler_stage2.step()

    status = "-"
    if vl_f1 > best_val_macro_f1:
        best_val_macro_f1 = vl_f1
        best_epoch = global_epoch
        patience_counter = 0
        status = "BEST (Saved)"
        torch.save({
            "epoch": global_epoch,
            "model_state_dict": model.state_dict(),
            "val_macro_f1": vl_f1,
            "val_accuracy": vl_acc,
            "classes": CLASSES
        }, best_model_path)
    else:
        patience_counter += 1
        status = f"Patience {patience_counter}/{PATIENCE}"

    history.append({
        "stage": 2, "epoch": global_epoch,
        "train_loss": tr_loss, "val_loss": vl_loss,
        "train_acc": tr_acc, "val_acc": vl_acc,
        "train_f1": tr_f1, "val_f1": vl_f1,
        "lr": lr
    })

    print(f"{'Stage 2':^7} | {global_epoch:^7} | {tr_loss:^11.4f} | {vl_loss:^11.4f} | {tr_acc*100:^10.2f}% | {vl_acc*100:^10.2f}% | {tr_f1:^11.4f} | {vl_f1:^11.4f} | {lr:^10.6f} | {status:^12}")

    if patience_counter >= PATIENCE:
        print(f"\\nEarly stopping triggered: Validation Macro F1 has not improved in {PATIENCE} epochs.")
        break

print("-" * 115)
print(f"Training completed! Best Validation Macro F1: {best_val_macro_f1:.4f} at Epoch {best_epoch}")
print(f"Best checkpoint saved to: {best_model_path}")
""")

# ---------------------------------------------------------------------------
# CELL 12: Training Curves Plotting
# ---------------------------------------------------------------------------
add_md("""## 11. Training & Convergence Analytics""")
add_code("""hist_df = pd.DataFrame(history)

plt.figure(figsize=(16, 5))

# Plot 1: Loss curves
plt.subplot(1, 3, 1)
plt.plot(hist_df["epoch"], hist_df["train_loss"], label="Train Loss", color="#2563EB", lw=2)
plt.plot(hist_df["epoch"], hist_df["val_loss"], label="Val Loss", color="#DC2626", lw=2)
plt.axvline(x=STAGE1_EPOCHS + 0.5, color="#64748B", linestyle="--", label="Stage 2 Unfreeze")
plt.title("Cross-Entropy Loss Evolution", fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.grid(True, alpha=0.3)
plt.legend()

# Plot 2: Accuracy & Macro F1
plt.subplot(1, 3, 2)
plt.plot(hist_df["epoch"], hist_df["val_acc"] * 100, label="Val Accuracy (%)", color="#16A34A", lw=2)
plt.plot(hist_df["epoch"], hist_df["val_f1"] * 100, label="Val Macro F1 (%)", color="#D97706", lw=2)
plt.axvline(x=STAGE1_EPOCHS + 0.5, color="#64748B", linestyle="--", label="Stage 2 Unfreeze")
plt.title("Validation Accuracy & F1 Progression", fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Score (%)")
plt.grid(True, alpha=0.3)
plt.legend()

# Plot 3: Learning Rate schedule
plt.subplot(1, 3, 3)
plt.plot(hist_df["epoch"], hist_df["lr"], color="#7C3AED", lw=2, label="Cosine LR")
plt.title("Cosine Annealing Learning Rate Schedule", fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Learning Rate")
plt.yscale("log")
plt.grid(True, alpha=0.3)
plt.legend()

plt.tight_layout()
plt.show()
""")

# ---------------------------------------------------------------------------
# CELL 13: Holdout Test Set Evaluation
# ---------------------------------------------------------------------------
add_md("""## 12. Rigorous Holdout Test Set Evaluation
Load the saved best checkpoint and evaluate on unseen holdout test data.""")
add_code("""# Load best checkpoint
checkpoint = torch.load(best_model_path, map_location=DEVICE)
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

print(f"Loaded Best Model Checkpoint from Epoch {checkpoint['epoch']} (Val Macro F1: {checkpoint['val_macro_f1']:.4f})")

test_loss = 0.0
all_preds = []
all_targets = []
all_probs = []

with torch.no_grad():
    for images, targets in test_loader:
        images = images.to(DEVICE)
        targets = targets.to(DEVICE)

        outputs = model(images)
        loss = criterion(outputs, targets)
        probs = F.softmax(outputs, dim=1)

        test_loss += loss.item() * images.size(0)
        all_preds.extend(torch.argmax(outputs, dim=1).cpu().numpy())
        all_targets.extend(targets.cpu().numpy())
        all_probs.extend(probs.cpu().numpy())

test_loss = test_loss / len(all_targets)
test_acc = accuracy_score(all_targets, all_preds)
test_macro_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0)

print("=" * 65)
print("TEST SET BENCHMARK RESULTS")
print("=" * 65)
print(f"Test Loss:           {test_loss:.4f}")
print(f"Test Accuracy:       {test_acc * 100:.2f}%")
print(f"Test Macro F1:       {test_macro_f1 * 100:.2f}%")
print("=" * 65)

# Classification Report
print("\\nDetailed Per-Class Classification Report:")
report = classification_report(all_targets, all_preds, target_names=CLASSES, digits=4, zero_division=0)
print(report)

# Normalized Confusion Matrix
cm = confusion_matrix(all_targets, all_preds, normalize="true")
plt.figure(figsize=(10, 8))
sns.heatmap(
    cm * 100, annot=True, fmt=".1f", cmap="Blues",
    xticklabels=CLASSES, yticklabels=CLASSES, cbar=True
)
plt.title("Holdout Test Set Normalized Confusion Matrix (%)", fontsize=13, fontweight="bold")
plt.xlabel("Predicted Class", fontweight="bold")
plt.ylabel("True Class", fontweight="bold")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.show()
""")

# ---------------------------------------------------------------------------
# CELL 14: Grad-CAM Explainable AI Implementation
# ---------------------------------------------------------------------------
add_md("""## 13. Explainable AI (XAI) — Grad-CAM Feature Attribution
Direct PyTorch implementation of Gradient-weighted Class Activation Mapping (Grad-CAM) to verify that the neural network attends to diagnostic material textures and geometric contours rather than background artifacts.""")
add_code("""class GradCAM:
    \"\"\"
    PyTorch Grad-CAM with forward/backward tensor hooks on the final convolutional layer.
    \"\"\"
    def __init__(self, model, target_layer=None, device=DEVICE):
        self.device = device
        self.model = model.to(self.device)
        self.model.eval()

        # Target layer for EfficientNet-B0: model.features[-1]
        if target_layer is None:
            self.target_layer = self.model.features[-1]
        else:
            self.target_layer = target_layer

        self.activations = None
        self.gradients = None
        self.hook_handle = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input_tensor, output_tensor):
            self.activations = output_tensor
            if output_tensor.requires_grad:
                output_tensor.register_hook(self._backward_hook)

        self.hook_handle = self.target_layer.register_forward_hook(forward_hook)

    def _backward_hook(self, grad):
        self.gradients = grad

    def generate(self, input_tensor, target_class=None):
        self.model.zero_grad()
        output = self.model(input_tensor)

        if target_class is None:
            target_class = torch.argmax(output, dim=1).item()

        score = output[0, target_class]
        score.backward(retain_graph=True)

        gradients = self.gradients.detach()
        activations = self.activations.detach()

        # Global average pooling of gradients
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * activations, dim=1, keepdim=True)
        cam = F.relu(cam)

        # Normalize heatmap to [0, 1]
        cam = cam.squeeze().cpu().numpy()
        cam = cv2.resize(cam, (IMG_SIZE, IMG_SIZE))
        cam_min, cam_max = np.min(cam), np.max(cam)
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        return cam, target_class, F.softmax(output, dim=1)[0].detach().cpu().numpy()

    def overlay(self, pil_image, heatmap, alpha=0.55):
        orig_img = np.array(pil_image.resize((IMG_SIZE, IMG_SIZE)))
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        overlay_img = np.uint8(alpha * heatmap_colored + (1 - alpha) * orig_img)
        return overlay_img

print("Grad-CAM Engine Initialized.")
""")

# ---------------------------------------------------------------------------
# CELL 15: Run Grad-CAM Saliency Demonstration
# ---------------------------------------------------------------------------
add_md("""## 14. Grad-CAM Saliency Map Visualization""")
add_code("""gradcam = GradCAM(model)

# Select sample test images to visualize
sample_subset = test_df.sample(min(4, len(test_df)), random_state=42)

plt.figure(figsize=(15, 8))
for idx, (_, row) in enumerate(sample_subset.iterrows()):
    img_path = row["filepath"]
    true_cls = row["label"]
    pil_img = Image.open(img_path).convert("RGB")
    input_t = eval_transforms(pil_img).unsqueeze(0).to(DEVICE)

    cam_map, pred_class, probs = gradcam.generate(input_t)
    overlay = gradcam.overlay(pil_img, cam_map)

    # Subplot: Original
    plt.subplot(len(sample_subset), 3, idx * 3 + 1)
    plt.imshow(pil_img.resize((IMG_SIZE, IMG_SIZE)))
    plt.title(f"Original: {true_cls}", fontsize=10, fontweight="bold")
    plt.axis("off")

    # Subplot: Grad-CAM Heatmap
    plt.subplot(len(sample_subset), 3, idx * 3 + 2)
    plt.imshow(cam_map, cmap="jet")
    plt.title(f"Grad-CAM Heatmap (features[-1])", fontsize=10)
    plt.axis("off")

    # Subplot: Superimposed Overlay
    plt.subplot(len(sample_subset), 3, idx * 3 + 3)
    plt.imshow(overlay)
    pred_str = CLASSES[pred_class]
    conf = probs[pred_class] * 100
    plt.title(f"Overlay &rarr; Pred: {pred_str} ({conf:.1f}%)", fontsize=10, fontweight="bold", color="green" if pred_str == true_cls else "red")
    plt.axis("off")

plt.tight_layout()
plt.show()
""")

# ---------------------------------------------------------------------------
# CELL 16: Inference & Export Function
# ---------------------------------------------------------------------------
add_md("""## 15. Real-Time Inference & Disposal Recommendation Function""")
add_code("""# Disposal and circular economy guidelines
DISPOSAL_GUIDE = {
    "cardboard": "Blue Bin &bull; Flatten boxes and remove plastic tapes.",
    "glass": "Green Bin &bull; Rinse containers. Remove metal caps. 100% infinitely recyclable.",
    "metal": "Yellow Bin &bull; Empty and rinse aluminum and tin cans.",
    "paper": "Blue Bin &bull; Keep clean and dry. Avoid grease-stained paper.",
    "plastic": "Yellow Bin &bull; Check resin code. Rinse and compress bottles.",
    "textile": "Purple / Donation Bin &bull; Clean used fabrics for textile repurposing.",
    "organic": "Green Compost Bin &bull; Food scraps and biodegradable organic waste.",
    "trash": "Black / Landfill Bin &bull; Non-recyclable composite residuals.",
    "battery": "Red Hazardous E-Waste Box &bull; Tape terminals. NEVER discard in general waste.",
    "vegetation": "Green Garden Waste Bin &bull; Yard cuttings and leaves for municipal composting."
}

def predict_single_item(image_path_or_pil):
    \"\"\"
    End-to-end inference function for production deployment.
    \"\"\"
    if isinstance(image_path_or_pil, str):
        pil_img = Image.open(image_path_or_pil).convert("RGB")
    else:
        pil_img = image_path_or_pil.convert("RGB")

    t_start = time.time()
    input_tensor = eval_transforms(pil_img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(input_tensor)
        probs = F.softmax(outputs, dim=1)[0].cpu().numpy()

    latency_ms = (time.time() - t_start) * 1000
    pred_idx = int(np.argmax(probs))
    pred_class = CLASSES[pred_idx]
    confidence = float(probs[pred_idx])

    result = {
        "predicted_class": pred_class,
        "confidence": confidence,
        "latency_ms": round(latency_ms, 2),
        "disposal_guidance": DISPOSAL_GUIDE.get(pred_class, "Standard municipal sorting."),
        "top_3_probabilities": [
            {"class": CLASSES[i], "probability": round(float(probs[i]), 4)}
            for i in np.argsort(probs)[::-1][:3]
        ]
    }
    return result

# Test sample inference
sample_pred = predict_single_item(test_df.iloc[0]["filepath"])
print("Sample Inference Output:")
print(json.dumps(sample_pred, indent=2))
""")

# ---------------------------------------------------------------------------
# CELL 17: ONNX and TorchScript Export
# ---------------------------------------------------------------------------
add_md("""## 16. Edge Export: TorchScript & ONNX Runtime
Export model for high-throughput sub-5ms low latency inference on edge microservices or web frontends.""")
add_code("""os.makedirs("exports", exist_ok=True)
dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE, device=DEVICE)

# 1. Export to TorchScript
scripted_model = torch.jit.trace(model, dummy_input)
torchscript_path = "exports/smart_waste_sorter.torchscript.pt"
scripted_model.save(torchscript_path)
print(f"Exported TorchScript model to: {torchscript_path} ({os.path.getsize(torchscript_path)/(1024*1024):.2f} MB)")

# 2. Export to ONNX
try:
    onnx_path = "exports/smart_waste_sorter.onnx"
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
    )
    print(f"Exported ONNX model to: {onnx_path} ({os.path.getsize(onnx_path)/(1024*1024):.2f} MB)")
except Exception as e:
    print("Notice: ONNX export skipped or optional:", e)

print("\\n" + "=" * 65)
print("TRAINING PIPELINE COMPLETE & READY FOR PRODUCTION!")
print("=" * 65)
""")

# Write notebook to target paths
paths = [
    "Sort-Waste/Smart_Waste_Sorter_Training.ipynb",
    "public/assets/sort-waste/Smart_Waste_Sorter_Training.ipynb",
    "website/assets/sort-waste/Smart_Waste_Sorter_Training.ipynb"
]

for p in paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=2)
    print(f"Successfully created: {p} ({os.path.getsize(p)} bytes)")
